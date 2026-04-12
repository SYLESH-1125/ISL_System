'use client'

import { Pause, Play, RotateCcw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PlaybackPhase } from '@/hooks/useSignPlaybackQueue'

type Props = {
  phase: PlaybackPhase
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRestart: () => void
  canPlay: boolean
  progress01: number
}

export function PlaybackControls({
  phase,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRestart,
  canPlay,
  progress01,
}: Props) {
  const pct = Math.round(progress01 * 100)

  return (
    <TooltipProvider delayDuration={180}>
      <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-card/90 to-background/60 p-1 shadow-inner ring-1 ring-white/[0.04] backdrop-blur-md">
        <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    size="lg"
                    className="h-11 min-w-[3.25rem] rounded-xl bg-gradient-to-b from-primary to-indigo-600 px-5 font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:brightness-110 disabled:opacity-35"
                    disabled={!canPlay || phase === 'playing'}
                    onClick={onPlay}
                  >
                    <Play className="h-5 w-5 fill-current" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">Play queue</TooltipContent>
            </Tooltip>

            {phase === 'playing' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="h-11 rounded-xl border border-white/10 px-5"
                    onClick={onPause}
                  >
                    <Pause className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Pause</TooltipContent>
              </Tooltip>
            ) : null}

            {phase === 'paused' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" size="lg" className="h-11 rounded-xl px-5" onClick={onResume}>
                    <Play className="h-5 w-5 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Resume</TooltipContent>
              </Tooltip>
            ) : null}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-xl border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/15 hover:text-red-200 disabled:opacity-30"
                  disabled={phase === 'idle'}
                  onClick={onStop}
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Stop</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="h-11 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  onClick={onRestart}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Replay last queue</TooltipContent>
            </Tooltip>
          </div>

          <div className="min-h-[44px] flex-1 px-1 sm:px-3">
            <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>Progress</span>
              <span className="font-mono text-foreground/80">{pct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted/90 ring-1 ring-inset ring-black/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-violet-400 to-secondary shadow-[0_0_12px_rgba(129,140,248,0.5)] transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
