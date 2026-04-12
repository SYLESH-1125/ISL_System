export type CWASAInstance = {
  init: (cfg: Record<string, unknown>) => void
  playSiGMLURL: (url: string) => Promise<void>
  stopAvatar: () => void
}

declare global {
  interface Window {
    CWASA?: CWASAInstance
    tuavatarLoaded?: boolean
    playerAvailableToPlay?: boolean
    playSign?: (signFile: string) => Promise<void>
    loadAvatar?: (avatar: string, url: string) => void
    SpeechRecognition?: new () => unknown
    webkitSpeechRecognition?: new () => unknown
  }
}

export {}
