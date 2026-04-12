'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type RecognitionLang = 'en-US' | 'hi-IN' | 'ta-IN'

type Options = {
  lang: RecognitionLang
  continuous: boolean
  interimResults: boolean
  onFinal: (text: string) => void
  onInterim?: (text: string) => void
  onUtteranceEnd?: () => void
}

export function useSpeechRecognition({
  lang,
  continuous,
  interimResults,
  onFinal,
  onInterim,
  onUtteranceEnd,
}: Options) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  type Rec = { continuous: boolean; interimResults: boolean; maxAlternatives: number; lang: string; start: () => void; stop: () => void; abort: () => void; onresult: ((e: unknown) => void) | null; onerror: ((e: unknown) => void) | null; onend: (() => void) | null }
  const recRef = useRef<Rec | null>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const SILENCE_MS = 900

  const onFinalRef = useRef(onFinal)
  const onInterimRef = useRef(onInterim)
  const onUtteranceEndRef = useRef(onUtteranceEnd)
  onFinalRef.current = onFinal
  onInterimRef.current = onInterim
  onUtteranceEndRef.current = onUtteranceEnd

  const clearSilence = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
  }

  const bumpSilence = useCallback(() => {
    clearSilence()
    if (!continuous || !onUtteranceEndRef.current) return
    silenceTimer.current = setTimeout(() => {
      onUtteranceEndRef.current?.()
    }, SILENCE_MS)
  }, [continuous])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      return
    }

    const recognition = new Ctor() as unknown as Rec
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = 1
    recognition.lang = lang

    recognition.onresult = (event: unknown) => {
      const ev = event as {
        resultIndex: number
        results: { isFinal: boolean; 0: { transcript: string } }[]
      }
      let interim = ''
      let finalChunk = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i]
        if (res.isFinal) finalChunk += res[0]?.transcript ?? ''
        else interim += res[0]?.transcript ?? ''
      }
      if (interim && onInterimRef.current) onInterimRef.current(interim)
      if (finalChunk) {
        onFinalRef.current(finalChunk.trim())
        bumpSilence()
      }
    }

    recognition.onerror = (e: unknown) => {
      const err = e as { error?: string }
      if (err.error !== 'aborted' && err.error !== 'no-speech') {
        console.warn('[speech]', err.error)
      }
      setListening(false)
      clearSilence()
    }

    recognition.onend = () => {
      setListening(false)
      clearSilence()
    }

    recRef.current = recognition

    return () => {
      clearSilence()
      try {
        recognition.abort()
      } catch {
        /* ignore */
      }
      recRef.current = null
    }
  }, [lang, continuous, interimResults, bumpSilence])

  useEffect(() => {
    if (recRef.current) recRef.current.lang = lang
  }, [lang])

  const start = useCallback(() => {
    const r = recRef.current
    if (!r || listening) return
    try {
      r.continuous = continuous
      r.interimResults = interimResults
      r.start()
      setListening(true)
      bumpSilence()
    } catch (e) {
      console.warn('[speech] start', e)
    }
  }, [listening, continuous, interimResults, bumpSilence])

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
    clearSilence()
  }, [])

  return { supported, listening, start, stop }
}
