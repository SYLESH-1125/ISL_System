'use client'

import '@/lib/cwasa-types'
import { useCallback, useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Database, Languages, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { DatasetViewer } from '@/components/dataset-viewer'
import { AvatarPlayer } from '@/components/isl/AvatarPlayer'
import { GlossDisplay } from '@/components/isl/GlossDisplay'
import { InputPanel } from '@/components/isl/InputPanel'
import { PlaybackControls } from '@/components/isl/PlaybackControls'
import { ThemeToggle } from '@/components/isl/ThemeToggle'
import { useCWASA } from '@/hooks/useCWASA'
import { useSignPlaybackQueue } from '@/hooks/useSignPlaybackQueue'
import { useSpeechRecognition, type RecognitionLang } from '@/hooks/useSpeechRecognition'
import type { ParagraphPlan } from '@/utils/glossMapper'
import { planParagraphMemo } from '@/utils/glossMapper'
import { cn } from '@/lib/utils'

export function ISLTranslatorApp() {
  const [inputText, setInputText] = useState('')
  const [interim, setInterim] = useState('')
  const [plan, setPlan] = useState<ParagraphPlan | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'main' | 'dataset'>('main')
  const [lang, setLang] = useState<RecognitionLang>('en-US')
  const lastPlanRef = useRef<ParagraphPlan | null>(null)
  const inputRef = useRef(inputText)
  inputRef.current = inputText

  const { scriptReady, setScriptReady, avatarReady, status: cwasaStatus, errorMessage, playGloss, stopAvatar } =
    useCWASA()

  const { phase, progress, run, stop, pause, resume } = useSignPlaybackQueue(playGloss, {
    delayBetweenSignsMs: 240,
    pauseBetweenSentencesMs: 700,
  })

  const rebuildPlan = useCallback(() => {
    const p = planParagraphMemo(inputRef.current)
    setPlan(p)
    lastPlanRef.current = p
    return p
  }, [])

  const voice = useSpeechRecognition({
    lang,
    continuous: true,
    interimResults: true,
    onFinal: (t) => {
      setInputText((prev) => (prev ? `${prev} ${t}` : t))
      setInterim('')
    },
    onInterim: (t) => setInterim(t),
    onUtteranceEnd: () => {
      setProcessing('Updating gloss queue…')
      window.setTimeout(() => {
        rebuildPlan()
        setProcessing(null)
      }, 0)
    },
  })

  const playbackBusy = phase === 'playing' || phase === 'paused'
  const engineLoading = !scriptReady || (scriptReady && cwasaStatus === 'loading' && !avatarReady)

  const handleTranslateAndPlay = useCallback(async () => {
    if (!inputText.trim()) return
    if (playbackBusy) return
    stop()
    stopAvatar()
    setProcessing('Analyzing sentences & mapping glosses…')
    const p = rebuildPlan()
    setProcessing(null)
    if (!p.flatQueue.length) return
    await run(p.flatQueue, p.sentences.length)
  }, [inputText, playbackBusy, stop, stopAvatar, rebuildPlan, run])

  const onRestart = () => {
    const p = lastPlanRef.current
    if (!p?.flatQueue.length) return
    void run(p.flatQueue, p.sentences.length)
  }

  const queueProgress01 =
    progress.queueLength > 0 ? (progress.currentQueueIndex + 1) / progress.queueLength : 0

  useEffect(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
  }, [activeTab])

  return (
    <>
      <Script
        src="/js/allcsa.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
        onError={() => setScriptReady(false)}
      />
      <link rel="stylesheet" href="/css/cwasa.css" />

      <div className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(129,140,248,0.18),transparent_50%),radial-gradient(ellipse_50%_45%_at_100%_30%,rgba(45,212,191,0.1),transparent_45%),radial-gradient(ellipse_45%_40%_at_0%_70%,rgba(192,132,252,0.09),transparent_42%)]"
          aria-hidden
        />
        <div className="pointer-events-none fixed inset-0 bg-showcase-grid opacity-[0.35]" aria-hidden />
        <div
          className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-40 shrink-0 border-b border-white/[0.06] bg-background/55 backdrop-blur-2xl">
            <div className="mx-auto flex w-full max-w-[min(100%,1880px)] items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-5 sm:py-3 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/40 via-indigo-500/30 to-secondary/30 shadow-[var(--shadow-glow)] ring-1 ring-white/10 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <Sparkles className="h-4 w-4 text-primary-foreground sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="hidden text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/90 sm:block">Showcase</p>
                  <h1 className="truncate bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-xl md:text-2xl">
                    Text → Indian Sign Language
                  </h1>
                  <p className="mt-0 hidden text-xs text-muted-foreground sm:block md:text-sm">
                    CWASA avatar · SiGML · Multi-sentence flow
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="mx-auto flex min-h-0 w-full max-w-[min(100%,1880px)] flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-3 pt-1 sm:px-5 sm:pb-4 sm:pt-2 lg:overflow-hidden lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1.5 flex min-w-0 shrink-0 flex-col gap-2 sm:mb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">Experience</h2>
                <p className="mt-0.5 hidden max-w-2xl text-[11px] leading-snug text-muted-foreground sm:block sm:text-xs md:text-[13px]">
                  Compose · live signer · gloss timeline — one screen.
                </p>
              </div>

              <div className="flex w-full min-w-0 shrink-0 rounded-lg border border-white/[0.08] bg-card/30 p-0.5 shadow-inner backdrop-blur-md sm:w-auto sm:rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-all sm:flex-initial sm:gap-2 sm:rounded-lg sm:px-4 sm:py-2.5 sm:text-sm',
                    activeTab === 'main'
                      ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <Languages className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate">Translator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('dataset')}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-all sm:flex-initial sm:gap-2 sm:rounded-lg sm:px-4 sm:py-2.5 sm:text-sm',
                    activeTab === 'dataset'
                      ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <Database className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate">Dataset</span>
                </button>
              </div>
            </motion.div>

            {processing ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-1.5 shrink-0 rounded-lg border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-center text-xs font-medium text-secondary sm:mb-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
              >
                {processing}
              </motion.p>
            ) : null}

            <div
              className={
                activeTab === 'main'
                  ? 'grid min-h-0 min-w-0 flex-1 auto-rows-min grid-cols-1 gap-3 overflow-visible sm:gap-4 lg:auto-rows-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch lg:justify-items-stretch lg:gap-5 lg:overflow-hidden'
                  : 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4'
              }
            >
              {activeTab === 'main' ? (
                <div className="flex min-h-0 w-full min-w-0 max-w-full lg:h-full lg:max-h-full">
                  <InputPanel
                    value={inputText}
                    onChange={setInputText}
                    onSubmit={() => void handleTranslateAndPlay()}
                    language={lang}
                    onLanguage={setLang}
                    voiceSupported={voice.supported}
                    listening={voice.listening}
                    onVoiceStart={() => voice.start()}
                    onVoiceStop={() => voice.stop()}
                    disabled={playbackBusy || engineLoading}
                    interimText={interim}
                  />
                </div>
              ) : null}

              <div
                className={
                  activeTab === 'dataset'
                    ? 'fixed bottom-4 right-4 z-50 flex max-h-[min(480px,calc(100dvh-6rem))] w-[min(100%,380px)] flex-col overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10'
                    : 'flex min-h-0 w-full min-w-0 max-w-full flex-col gap-2 sm:gap-3 lg:h-full lg:max-h-full lg:gap-4'
                }
              >
                <AvatarPlayer
                  compact={activeTab === 'dataset'}
                  isLoading={engineLoading}
                  phase={phase}
                  statusLabel={errorMessage ?? (cwasaStatus === 'ready' ? 'Ready' : cwasaStatus)}
                  scriptLoaded={scriptReady}
                />
                {activeTab === 'main' ? (
                  <div className="shrink-0">
                  <PlaybackControls
                    phase={phase}
                    onPlay={() => {
                      const p = plan ?? lastPlanRef.current
                      if (!p?.flatQueue.length) return
                      void run(p.flatQueue, p.sentences.length)
                    }}
                    onPause={pause}
                    onResume={resume}
                    onStop={() => {
                      stop()
                      stopAvatar()
                    }}
                    onRestart={onRestart}
                    canPlay={Boolean((plan ?? lastPlanRef.current)?.flatQueue.length)}
                    progress01={
                      progress.queueLength > 0
                        ? Math.max(0, (progress.currentQueueIndex + 1) / progress.queueLength)
                        : 0
                    }
                  />
                  </div>
                ) : null}
              </div>

              {activeTab === 'main' ? (
                <div className="flex min-h-0 w-full min-w-0 max-w-full lg:h-full lg:max-h-full">
                  <GlossDisplay
                    displayTokens={plan?.displayTokens ?? lastPlanRef.current?.displayTokens ?? []}
                    flatQueue={plan?.flatQueue ?? lastPlanRef.current?.flatQueue ?? []}
                    currentGloss={progress.currentGloss}
                    sentenceIndex={progress.sentenceIndex}
                    totalSentences={plan?.sentences.length ?? lastPlanRef.current?.sentences.length ?? 0}
                    phase={phase}
                    processingLabel={
                      phase === 'playing' && progress.totalSentences
                        ? `Sentence ${progress.sentenceIndex + 1} / ${progress.totalSentences}`
                        : null
                    }
                    currentTokenIndex={progress.currentTokenIndex}
                    queueProgress01={queueProgress01}
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-white/[0.06] bg-card/20 p-1 shadow-[var(--shadow-card)] backdrop-blur-sm">
                  <DatasetViewer />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
