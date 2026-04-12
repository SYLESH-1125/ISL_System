/** Tamil / Hindi script → English keys used downstream */
export const WORD_TRANSLATIONS: Record<string, string> = {
  'வணக்கம்': 'hello',
  'நன்றி': 'thankyou',
  'வாருங்கள்': 'come',
  'போ': 'go',
  'ஆம்': 'yes',
  'இல்லை': 'no',
  'நல்ல': 'good',
  'கெட்ட': 'bad',
  'பெரிய': 'big',
  'சிறிய': 'small',
  'नमस्ते': 'hello',
  'धन्यवाद': 'thankyou',
  'आओ': 'come',
  'जाओ': 'go',
  'हाँ': 'yes',
  'नहीं': 'no',
  'अच्छा': 'good',
  'बुरा': 'bad',
  'बड़ा': 'big',
  'छोटा': 'small',
}

const ARTICLES = new Set(['the', 'a', 'an'])

/** Split paragraph into sentences (Intl.Segmenter when available). */
export function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' })
      const parts: string[] = []
      for (const { segment } of segmenter.segment(trimmed)) {
        const s = segment.trim()
        if (s) parts.push(s)
      }
      if (parts.length) return parts
    } catch {
      /* fall through */
    }
  }

  return trimmed
    .split(/(?<=[.!?…]["')\]]?)\s+(?=[A-Z\d"'(])|(?<=[.!?])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Strip outer punctuation for token matching */
export function stripEdgePunctuation(token: string): string {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase()
}

/**
 * Remove articles only when they sit *between* content words (never strip negations).
 */
export function applySmartStopwords(tokens: string[]): string[] {
  if (tokens.length <= 2) return tokens

  return tokens.filter((raw, i) => {
    const w = stripEdgePunctuation(raw)
    if (!ARTICLES.has(w)) return true
    if (i === 0 || i === tokens.length - 1) return true
    return false
  })
}

export function tokenizeSentence(sentence: string): string[] {
  const n = normalizeWhitespace(sentence)
  if (!n) return []
  return n.split(/\s+/).filter(Boolean).map((raw) => {
    if (WORD_TRANSLATIONS[raw]) return WORD_TRANSLATIONS[raw]
    const stripped = stripEdgePunctuation(raw)
    if (WORD_TRANSLATIONS[stripped]) return WORD_TRANSLATIONS[stripped]
    return stripped || raw.toLowerCase()
  })
}
