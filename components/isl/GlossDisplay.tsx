'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ListOrdered } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { QueueItem } from '@/utils/glossMapper'

type Props = {
  displayTokens: string[]
  flatQueue: QueueItem[]
  currentGloss: string | null
  sentenceIndex: number
  totalSentences: number
  phase: 'idle' | 'playing' | 'paused'
  processingLabel?: string | null
  currentTokenIndex: number
  /** 0–1 playback through SiGML queue */
  queueProgress01: number
}

export function GlossDisplay({
  displayTokens,
  flatQueue,
  currentGloss,
  sentenceIndex,
  totalSentences,
  phase,
  processingLabel,
  currentTokenIndex,
  queueProgress01,
}: Props) {
  const queuePct = Math.round(Math.min(1, Math.max(0, queueProgress01)) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="h-full min-h-0 w-full max-w-full min-w-0 max-h-full"
    >
      <Card className="flex h-full min-h-0 w-full max-w-full min-w-0 max-h-full flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-card/40 p-0 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 px-5 pb-5 pt-5">
          {processingLabel ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 inline-flex min-w-0 items-center gap-2 rounded-lg border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary"
            >
              <ListOrdered className="h-3.5 w-3.5 shrink-0" />
              {processingLabel}
            </motion.p>
          ) : phase !== 'idle' && totalSentences > 0 ? (
            <p className="mb-2 text-[11px] text-muted-foreground">
              Sentence{' '}
              <span className="font-semibold text-foreground">{Math.min(sentenceIndex + 1, totalSentences)}</span> of{' '}
              <span className="font-semibold text-foreground">{totalSentences}</span>
            </p>
          ) : null}

          <div className="mb-3 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-white/[0.06] bg-background/30 p-3 ring-1 ring-inset ring-white/[0.03]">
            <div className="flex flex-wrap content-start gap-2 break-words">
              <AnimatePresence mode="popLayout">
                {displayTokens.length === 0 ? (
                  <div className="min-h-[3rem] w-full" aria-hidden />
                ) : (
                  displayTokens.map((w, i) => {
                    const isActive = phase !== 'idle' && i === currentTokenIndex
                    const isPast = phase !== 'idle' && currentTokenIndex >= 0 && i < currentTokenIndex

                    return (
                      <motion.span
                        key={`${w}-${i}`}
                        layout
                        initial={{ opacity: 0, scale: 0.88, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                        className={`relative max-w-full break-words rounded-xl px-3 py-1.5 text-left text-xs font-semibold tracking-tight whitespace-normal transition-shadow [overflow-wrap:anywhere] ${
                          isActive
                            ? 'bg-gradient-to-r from-accent to-primary text-white shadow-lg shadow-primary/30 ring-2 ring-white/20'
                            : isPast
                              ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25'
                              : 'bg-muted/80 text-muted-foreground ring-1 ring-white/[0.04]'
                        }`}
                      >
                        {w}
                        {isActive ? (
                          <motion.span
                            layoutId="glossUnderline"
                            className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-secondary"
                          />
                        ) : null}
                      </motion.span>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-white/[0.08] bg-gradient-to-br from-background/80 to-muted/30 p-3.5 ring-1 ring-white/[0.04]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Active gloss</p>
            <p className="mt-1.5 break-words font-mono text-xl font-semibold tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-2xl">
              {currentGloss ?? '—'}
            </p>
          </div>

          {flatQueue.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Queue depth</span>
                <span className="font-mono font-medium text-foreground">{flatQueue.length} clips</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/80">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                  initial={false}
                  animate={{ width: `${Math.min(100, Math.max(2, queuePct))}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  )
}
