'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CWASAInstance } from '@/lib/cwasa-types'
import { glossToSigmlPath } from '@/utils/glossMapper'

const CWASA_INIT = {
  avsbsl: ['luna', 'siggi', 'anna', 'marc', 'francoise'],
  avSettings: { avList: 'avsbsl', initAv: 'marc' },
} as const

function setSiGMLURLField(url: string) {
  const urlInput = document.getElementById('URLText') as HTMLInputElement | null
  if (urlInput) urlInput.value = url
}

/** Poll CWASA status field until idle / error (no global setInterval in UI). */
export async function waitForCwasaPlaybackIdle(
  opts: { timeoutMs?: number; pollMs?: number } = {},
): Promise<'ready' | 'error'> {
  const timeoutMs = opts.timeoutMs ?? 45_000
  const pollMs = opts.pollMs ?? 80
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const el =
      (document.querySelector('.statusExtra.av0') as HTMLInputElement | null) ??
      (document.querySelector('.statusExtra') as HTMLInputElement | null)
    const v = (el?.value ?? '').toLowerCase()
    if (v.includes('invalid')) return 'error'
    // CWASA uses "Playing complete" (no "ready") when a clip finishes
    if (v.includes('ready') || v.includes('complete')) return 'ready'
    await new Promise((r) => setTimeout(r, pollMs))
  }
  return 'ready'
}

export function useCWASA() {
  const cwaRef = useRef<CWASAInstance | null>(null)
  const pollRef = useRef<number | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [avatarReady, setAvatarReady] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const initWhenPossible = useCallback(() => {
    if (typeof window === 'undefined' || !window.CWASA) return

    const container = document.querySelector('.CWASAAvatar.av0')
    if (!container) return

    const hasLive =
      Boolean(container.querySelector('canvas')) ||
      Boolean(container.querySelector('iframe')) ||
      (container as HTMLElement).innerHTML.length > 100

    if (window.CWASA && hasLive) {
      cwaRef.current = window.CWASA
      setAvatarReady(true)
      setStatus('ready')
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
      return
    }

    if (cwaRef.current && !hasLive) {
      cwaRef.current = null
    }

    if (cwaRef.current) return

    try {
      window.tuavatarLoaded = false
      window.playerAvailableToPlay = true
      window.CWASA.init(CWASA_INIT as unknown as Record<string, unknown>)
      cwaRef.current = window.CWASA
      setStatus('loading')

      const done = () => {
        window.tuavatarLoaded = true
        setAvatarReady(true)
        setStatus('ready')
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'))
        })
      }

      pollRef.current = window.setInterval(() => {
        const av = document.querySelector('.CWASAAvatar.av0')
        const canvas = av?.querySelector('canvas')
        const iframe = av?.querySelector('iframe')
        const long = ((av as HTMLElement | undefined)?.innerHTML.length ?? 0) > 100
        if (canvas || iframe || long) {
          if (pollRef.current != null) window.clearInterval(pollRef.current)
          pollRef.current = null
          done()
        }
      }, 200)

      window.setTimeout(() => {
        if (pollRef.current != null) window.clearInterval(pollRef.current)
        pollRef.current = null
        const av = document.querySelector('.CWASAAvatar.av0')
        const long = (av?.innerHTML.length ?? 0) > 100
        if (long) done()
        else {
          setStatus('ready')
          setAvatarReady(true)
        }
      }, 5000)
    } catch (e) {
      console.error('[CWASA] init error', e)
      setStatus('error')
      setErrorMessage('CWASA failed to initialize')
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current != null) window.clearInterval(pollRef.current)
    }
  }, [])

  useEffect(() => {
    if (!scriptReady) return

    const t = window.setTimeout(initWhenPossible, 120)
    return () => {
      window.clearTimeout(t)
      if (pollRef.current != null) window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [scriptReady, initWhenPossible])

  const playGloss = useCallback(async (gloss: string) => {
    const cwa = cwaRef.current
    if (!cwa) throw new Error('CWASA not ready')
    const url = glossToSigmlPath(gloss)
    setSiGMLURLField(url)
    await cwa.playSiGMLURL(url)
    await new Promise((r) => setTimeout(r, 120))
    const end = await waitForCwasaPlaybackIdle({ timeoutMs: 60_000 })
    if (end === 'error') throw new Error('Invalid or failed SiGML')
  }, [])

  const stopAvatar = useCallback(() => {
    try {
      cwaRef.current?.stopAvatar()
    } catch {
      /* ignore */
    }
  }, [])

  const registerPlaySignBridge = useCallback(() => {
    window.playSign = async (signFile: string) => {
      const cwa = cwaRef.current
      if (!cwa) return
      setSiGMLURLField(signFile)
      await cwa.playSiGMLURL(signFile)
      await waitForCwasaPlaybackIdle()
    }
  }, [])

  useEffect(() => {
    if (status === 'ready' && cwaRef.current) {
      registerPlaySignBridge()
    }
  }, [status, registerPlaySignBridge])

  return {
    scriptReady,
    setScriptReady,
    avatarReady,
    status,
    errorMessage,
    cwaRef,
    playGloss,
    stopAvatar,
    registerPlaySignBridge,
  }
}
