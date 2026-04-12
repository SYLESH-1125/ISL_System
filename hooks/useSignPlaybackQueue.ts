'use client'

import { useCallback, useRef, useState } from 'react'
import type { QueueItem } from '@/utils/glossMapper'

export type PlaybackPhase = 'idle' | 'playing' | 'paused'

export type PlaybackProgress = {
  currentQueueIndex: number
  queueLength: number
  sentenceIndex: number
  totalSentences: number
  currentGloss: string | null
  currentDisplayToken: string | null
  /** Index in SOV display token list */
  currentTokenIndex: number
}

type RunOptions = {
  delayBetweenSignsMs?: number
  pauseBetweenSentencesMs?: number
}

export function useSignPlaybackQueue(
  playGloss: (gloss: string) => Promise<void>,
  defaultOpts: RunOptions = {},
) {
  const [phase, setPhase] = useState<PlaybackPhase>('idle')
  const [progress, setProgress] = useState<PlaybackProgress>({
    currentQueueIndex: -1,
    queueLength: 0,
    sentenceIndex: 0,
    totalSentences: 0,
    currentGloss: null,
    currentDisplayToken: null,
    currentTokenIndex: -1,
  })

  const cancelRef = useRef(false)
  const pauseRef = useRef(false)
  const runPromiseRef = useRef<Promise<void> | null>(null)

  const waitWhilePaused = async () => {
    while (pauseRef.current && !cancelRef.current) {
      await new Promise((r) => setTimeout(r, 120))
    }
  }

  const run = useCallback(
    async (queue: QueueItem[], totalSentences: number, opts?: RunOptions) => {
      const delayBetweenSignsMs = opts?.delayBetweenSignsMs ?? defaultOpts.delayBetweenSignsMs ?? 220
      const pauseBetweenSentencesMs =
        opts?.pauseBetweenSentencesMs ?? defaultOpts.pauseBetweenSentencesMs ?? 600

      cancelRef.current = false
      pauseRef.current = false
      setPhase('playing')
      setProgress({
        currentQueueIndex: 0,
        queueLength: queue.length,
        sentenceIndex: queue[0]?.sentenceIndex ?? 0,
        totalSentences,
        currentGloss: queue[0]?.gloss ?? null,
        currentDisplayToken: queue[0]?.displayToken ?? null,
        currentTokenIndex: queue[0]?.tokenIndex ?? -1,
      })

      const exec = async () => {
        for (let i = 0; i < queue.length; i++) {
          if (cancelRef.current) break
          await waitWhilePaused()
          if (cancelRef.current) break

          const item = queue[i]
          setProgress({
            currentQueueIndex: i,
            queueLength: queue.length,
            sentenceIndex: item.sentenceIndex,
            totalSentences,
            currentGloss: item.gloss,
            currentDisplayToken: item.displayToken,
            currentTokenIndex: item.tokenIndex,
          })

          try {
            await playGloss(item.gloss)
          } catch (e) {
            console.warn('[queue] gloss failed', item.gloss, e)
          }

          await new Promise((r) => setTimeout(r, delayBetweenSignsMs))

          const next = queue[i + 1]
          if (next && next.sentenceIndex !== item.sentenceIndex) {
            await new Promise((r) => setTimeout(r, pauseBetweenSentencesMs))
          }
        }

        setPhase('idle')
        pauseRef.current = false
        setProgress({
          currentQueueIndex: -1,
          queueLength: 0,
          sentenceIndex: 0,
          totalSentences: 0,
          currentGloss: null,
          currentDisplayToken: null,
          currentTokenIndex: -1,
        })
      }

      runPromiseRef.current = exec()
      await runPromiseRef.current
    },
    [playGloss, defaultOpts.delayBetweenSignsMs, defaultOpts.pauseBetweenSentencesMs],
  )

  const stop = useCallback(() => {
    cancelRef.current = true
    pauseRef.current = false
    setPhase('idle')
    setProgress({
      currentQueueIndex: -1,
      queueLength: 0,
      sentenceIndex: 0,
      totalSentences: 0,
      currentGloss: null,
      currentDisplayToken: null,
      currentTokenIndex: -1,
    })
  }, [])

  const pause = useCallback(() => {
    if (phase === 'playing') {
      pauseRef.current = true
      setPhase('paused')
    }
  }, [phase])

  const resume = useCallback(() => {
    if (phase === 'paused') {
      pauseRef.current = false
      setPhase('playing')
    }
  }, [phase])

  return { phase, progress, run, stop, pause, resume }
}
