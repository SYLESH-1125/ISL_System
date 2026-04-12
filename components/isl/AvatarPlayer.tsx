'use client'

import { motion } from 'framer-motion'
import { Loader2, UserRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { PlaybackPhase } from '@/hooks/useSignPlaybackQueue'

type Props = {
  isLoading: boolean
  phase: PlaybackPhase
  statusLabel: string
  scriptLoaded: boolean
  compact?: boolean
}

export function AvatarPlayer({ isLoading, phase, statusLabel, scriptLoaded, compact }: Props) {
  const signing = phase === 'playing' || phase === 'paused'
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [compact])

  return (
    <motion.div
      className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        className={`relative flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card/35 p-0 shadow-[var(--shadow-card)] backdrop-blur-2xl transition-[box-shadow,border-color] duration-500 lg:rounded-3xl ${
          signing
            ? 'border-secondary/40 shadow-[0_0_60px_-12px_rgba(45,212,191,0.35)]'
            : 'border-white/[0.07] hover:border-white/[0.1]'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-32 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <Badge className="shrink-0 rounded-md border-0 bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-secondary">
              Stage
            </Badge>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base md:text-lg">Live signer</h2>
              <p className="hidden truncate text-[11px] text-muted-foreground sm:block">CWASA · SiGML playback</p>
            </div>
          </div>
          <div
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[10px] font-medium transition-colors sm:h-9 sm:gap-2 sm:px-2.5 sm:text-[11px] ${
              signing
                ? 'border-secondary/40 bg-secondary/10 text-secondary'
                : 'border-white/[0.08] bg-background/40 text-muted-foreground'
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${signing ? 'animate-pulse bg-secondary' : 'bg-muted-foreground/40'}`} />
            {signing ? 'Performing' : 'Idle'}
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col px-3.5 pb-2 pt-1.5 sm:px-5 sm:pb-3 sm:pt-2">
          <div
            ref={stageRef}
            className={`relative mx-auto w-full max-w-none overflow-hidden rounded-lg ring-1 ring-white/[0.08] sm:rounded-xl ${
              compact
                ? 'h-[240px] min-h-[240px] shrink-0'
                : 'h-[min(40dvh,260px)] min-h-[150px] shrink-0 lg:min-h-[200px] lg:h-auto lg:flex-1'
            }`}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.12),transparent_55%)] sm:rounded-xl"
              aria-hidden
            />
            <div className="CWASAAvatar av0 absolute inset-0 z-[1] box-border rounded-lg sm:rounded-xl" />

            {isLoading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-950/75 backdrop-blur-md sm:gap-3 sm:rounded-xl">
                <Loader2 className="h-11 w-11 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground/90">
                  {!scriptLoaded ? 'Loading signing engine…' : 'Waking avatar…'}
                </p>
                <p className="max-w-xs text-center text-xs text-muted-foreground">First load pulls the CWASA runtime — usually a few seconds.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative mt-auto grid shrink-0 grid-cols-2 gap-2 border-t border-white/[0.05] px-3.5 py-2 sm:gap-3 sm:px-5 sm:py-3">
          <div className="rounded-xl bg-background/35 px-3 py-2 ring-1 ring-white/[0.05]">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <UserRound className="h-3 w-3 shrink-0" />
              Frame
            </span>
            <input
              readOnly
              className="txtSF av0 mt-1 w-full min-w-0 border-0 bg-transparent p-0 font-mono text-sm font-bold text-red-400 outline-none"
              defaultValue=""
            />
          </div>
          <div className="min-w-0 rounded-xl bg-background/35 px-3 py-2 ring-1 ring-white/[0.05]">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Engine line</span>
            <input
              readOnly
              className="statusExtra av0 mt-1 w-full truncate border-0 bg-transparent p-0 text-xs text-muted-foreground outline-none"
              defaultValue=""
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/[0.05] px-3.5 py-2 sm:px-5 sm:py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">Pipeline</span>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400/90">
            {statusLabel}
          </span>
        </div>

        <input type="text" id="URLText" className="txtSiGMLURL av0 hidden" readOnly />

        <div className="shrink-0 border-t border-white/[0.05] bg-black/20 px-3.5 py-2 sm:px-5 sm:py-3">
          <p className="mb-1 text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70 sm:mb-1.5 sm:text-[10px]">
            Avatar &amp; speed
          </p>
          <div className="CWASAAvMenu av0 flex flex-wrap justify-center gap-2" />
          <div className="mt-1.5 flex justify-center">
            <span className="CWASASpeed av0" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
