'use client'

import { motion } from 'framer-motion'
import { Keyboard, Mic, MicOff, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RecognitionLang } from '@/hooks/useSpeechRecognition'

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  language: RecognitionLang
  onLanguage: (l: RecognitionLang) => void
  voiceSupported: boolean
  listening: boolean
  onVoiceStart: () => void
  onVoiceStop: () => void
  disabled: boolean
  interimText?: string
}

export function InputPanel({
  value,
  onChange,
  onSubmit,
  language,
  onLanguage,
  voiceSupported,
  listening,
  onVoiceStart,
  onVoiceStop,
  disabled,
  interimText,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="h-full w-full min-w-0 max-w-full"
    >
      <Card className="group relative flex h-full min-h-0 w-full max-w-full min-w-0 max-h-full flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-card/40 p-0 shadow-[var(--shadow-card)] backdrop-blur-xl transition-colors hover:border-white/[0.1]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-80" />

        <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-5">
          <div className="shrink-0">
            <Label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Recognition language
            </Label>
            <Select value={language} onValueChange={(v) => onLanguage(v as RecognitionLang)} disabled={disabled}>
              <SelectTrigger className="mt-2 h-11 rounded-xl border-white/[0.08] bg-background/50 text-left text-sm shadow-inner transition hover:bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] rounded-xl border-white/10">
                <SelectItem value="en-US" className="rounded-lg">
                  English
                </SelectItem>
                <SelectItem value="hi-IN" className="rounded-lg">
                  Hindi
                </SelectItem>
                <SelectItem value="ta-IN" className="rounded-lg">
                  Tamil
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Your message
            </Label>
            <textarea
              className="mt-2 min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-xl border border-white/[0.08] bg-background/40 px-3.5 py-3 text-sm leading-relaxed text-foreground shadow-inner outline-none transition placeholder:text-muted-foreground/45 focus:border-primary/35 focus:ring-2 focus:ring-primary/25"
              style={{ minHeight: '6.5rem' }}
              placeholder="Message to convert to ISL"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground/75">
              <Keyboard className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-65" />
              Tip: clear punctuation between ideas for cleaner sentence boundaries.
            </p>
          </div>

          {interimText ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs italic text-secondary"
            >
              Listening… <span className="font-medium not-italic text-teal-100">{interimText}</span>
            </motion.p>
          ) : null}

          <div className="mt-auto flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            {voiceSupported ? (
              <Button
                type="button"
                variant={listening ? 'destructive' : 'secondary'}
                className="h-11 flex-1 rounded-xl border border-white/[0.06] shadow-sm sm:flex-initial sm:px-6"
                onClick={listening ? onVoiceStop : onVoiceStart}
                disabled={disabled}
              >
                {listening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" /> Stop mic
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" /> Live voice
                  </>
                )}
              </Button>
            ) : (
              <p className="text-center text-xs text-amber-400/90 sm:text-left">Voice not available in this browser.</p>
            )}

            <Button
              type="button"
              disabled={disabled || !value.trim()}
              className="h-11 flex-1 rounded-xl bg-gradient-to-r from-primary via-indigo-500 to-accent px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-40 sm:min-w-[200px]"
              onClick={() => onSubmit()}
            >
              <Send className="mr-2 h-4 w-4 opacity-90" />
              Translate &amp; play
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
