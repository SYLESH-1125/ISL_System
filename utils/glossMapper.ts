import { ISL_DATASET } from '@/isl-dataset'
import { SIGML_WORD_SET } from '@/lib/sigml-words'
import { convertToSOV } from '@/utils/sovConverter'
import {
  applySmartStopwords,
  splitIntoSentences,
  tokenizeSentence,
} from '@/utils/textProcessing'

export type GlossResolutionSource =
  | 'dataset-exact'
  | 'dataset-lemma'
  | 'dataset-variant'
  | 'synonym'
  | 'sigml-exact'
  | 'sigml-contains'
  | 'fingerspell'

export type QueueItem = {
  id: string
  gloss: string
  displayToken: string
  sentenceIndex: number
  tokenIndex: number
  source: GlossResolutionSource
  isFingerSpell?: boolean
}

export type ParagraphPlan = {
  sentences: {
    raw: string
    displayTokens: string[]
    items: QueueItem[]
  }[]
  flatQueue: QueueItem[]
  displayTokens: string[]
}

/** Irregular forms → base lemma for dataset / SIGML lookup */
const IRREGULAR_LEMMAS: Record<string, string> = {
  went: 'go',
  gone: 'go',
  ate: 'eat',
  eaten: 'eat',
  saw: 'see',
  seen: 'see',
  came: 'come',
  ran: 'run',
  took: 'take',
  gave: 'give',
  spoke: 'say',
  bought: 'buy',
  thought: 'think',
  taught: 'teach',
  caught: 'catch',
  fought: 'fight',
  brought: 'bring',
  sought: 'search',
  did: 'do',
  done: 'do',
  had: 'have',
  said: 'say',
  told: 'tell',
  got: 'get',
  became: 'become',
  began: 'begin',
  broke: 'break',
  chose: 'choose',
  drew: 'draw',
  drove: 'drive',
  fell: 'fall',
  felt: 'feel',
  found: 'find',
  flew: 'fly',
  forgot: 'forget',
  forgave: 'forgive',
  froze: 'freeze',
  grew: 'grow',
  hung: 'hang',
  hid: 'hide',
  hit: 'hit',
  held: 'hold',
  hurt: 'hurt',
  kept: 'keep',
  knew: 'know',
  led: 'lead',
  left: 'leave',
  lent: 'lend',
  lay: 'lie',
  lit: 'light',
  lost: 'lose',
  made: 'make',
  meant: 'mean',
  met: 'meet',
  paid: 'pay',
  read: 'read',
  rode: 'ride',
  rang: 'call',
  rose: 'up',
  sold: 'sell',
  sent: 'send',
  shook: 'shake',
  showed: 'see',
  shut: 'close',
  sat: 'sit',
  slept: 'sleep',
  slid: 'slide',
  spent: 'pay',
  spread: 'spread',
  stood: 'stand',
  stole: 'take',
  stuck: 'hold',
  struck: 'fight',
  swept: 'broom',
  swam: 'travel',
  swung: 'hang',
  tore: 'tear',
  threw: 'throw',
  understood: 'understand',
  woke: 'wake',
  wore: 'wear',
  won: 'win',
  wrote: 'write',
}

/** Small synonym → canonical (English) for gloss lookup */
const SYNONYM_TO_CANONICAL: Record<string, string> = {
  large: 'big',
  tiny: 'small',
  speak: 'say',
  speaking: 'say',
  talked: 'talk',
  chatting: 'talk',
  automobile: 'car',
  movie: 'cinema',
  film: 'cinema',
  physician: 'doctor',
  meds: 'medicine',
  quick: 'fast',
  rapid: 'quick',
  assist: 'help',
  aid: 'help',
  purchase: 'buy',
  father: 'father',
  dad: 'father',
  mother: 'mother',
  mom: 'mother',
  hi: 'hello',
  thanks: 'thankyou',
  thank: 'thankyou',
  bye: 'bye',
}

let datasetExact: Map<string, string> | null = null
let sigmlContainsSorted: string[] | null = null

function getDatasetMap(): Map<string, string> {
  if (datasetExact) return datasetExact
  const m = new Map<string, string>()
  for (const row of ISL_DATASET) {
    m.set(row.word.toLowerCase(), row.sign)
  }
  datasetExact = m
  return m
}

function getContainsCandidates(): string[] {
  if (sigmlContainsSorted) return sigmlContainsSorted
  const arr = [...SIGML_WORD_SET].filter((w) => w.length > 3)
  arr.sort((a, b) => b.length - a.length)
  sigmlContainsSorted = arr
  return arr
}

function morphologicalVariants(w: string): string[] {
  const v = new Set<string>()
  v.add(w)
  if (w.endsWith('ing')) v.add(w.slice(0, -3))
  if (w.endsWith('ing')) v.add(w.slice(0, -3) + 'e')
  if (w.endsWith('ed')) v.add(w.slice(0, -2))
  if (w.endsWith('ed')) v.add(w.slice(0, -1))
  if (w.endsWith('ies')) v.add(w.slice(0, -3) + 'y')
  if (w.endsWith('es')) v.add(w.slice(0, -2))
  if (w.endsWith('es')) v.add(w.slice(0, -1))
  if (w.endsWith('s') && w.length > 2) v.add(w.slice(0, -1))
  return [...v].filter(Boolean)
}

function lemmatizeLite(word: string): string {
  const lower = word.toLowerCase()
  return IRREGULAR_LEMMAS[lower] ?? lower
}

function resolveSingleGloss(token: string): {
  glosses: string[]
  source: GlossResolutionSource
} {
  const lower = token.toLowerCase()
  const ds = getDatasetMap()

  if (ds.has(lower)) {
    return { glosses: [ds.get(lower)!], source: 'dataset-exact' }
  }

  const canon = SYNONYM_TO_CANONICAL[lower]
  if (canon) {
    if (ds.has(canon)) return { glosses: [ds.get(canon)!], source: 'synonym' }
    if (SIGML_WORD_SET.has(canon)) return { glosses: [canon], source: 'synonym' }
  }

  const lemma = lemmatizeLite(lower)
  if (lemma !== lower && ds.has(lemma)) {
    return { glosses: [ds.get(lemma)!], source: 'dataset-lemma' }
  }
  if (lemma !== lower && SIGML_WORD_SET.has(lemma)) {
    return { glosses: [lemma], source: 'dataset-lemma' }
  }

  for (const variant of morphologicalVariants(lower)) {
    if (ds.has(variant)) {
      return { glosses: [ds.get(variant)!], source: 'dataset-variant' }
    }
    if (SIGML_WORD_SET.has(variant)) {
      return { glosses: [variant], source: 'dataset-variant' }
    }
  }

  if (SIGML_WORD_SET.has(lower)) {
    return { glosses: [lower], source: 'sigml-exact' }
  }

  for (const sign of getContainsCandidates()) {
    if (lower.includes(sign)) {
      return { glosses: [sign], source: 'sigml-contains' }
    }
  }

  const letters = [...lower].filter((c) => /[a-z0-9]/i.test(c))
  if (letters.length === 0) {
    return { glosses: [], source: 'fingerspell' }
  }

  const spell: string[] = []
  for (const c of letters) {
    const ch = c.toLowerCase()
    if (SIGML_WORD_SET.has(ch)) spell.push(ch)
  }
  if (spell.length) {
    return { glosses: spell, source: 'fingerspell' }
  }

  return { glosses: ['hello'], source: 'sigml-exact' }
}

let idCounter = 0
function nextId() {
  idCounter += 1
  return `q-${idCounter}`
}

export function planParagraph(text: string): ParagraphPlan {
  const trimmed = text.trim()
  if (!trimmed) {
    return { sentences: [], flatQueue: [], displayTokens: [] }
  }

  let sentencesRaw = splitIntoSentences(trimmed)
  if (!sentencesRaw.length) {
    sentencesRaw = [trimmed]
  }

  const sentences: ParagraphPlan['sentences'] = []
  const flatQueue: QueueItem[] = []
  const allDisplay: string[] = []
  let globalToken = 0

  sentencesRaw.forEach((raw, sentenceIndex) => {
    const tokens = tokenizeSentence(raw)
    const filtered = applySmartStopwords(tokens)
    const sov = convertToSOV(filtered)
    const items: QueueItem[] = []

    sov.forEach((displayToken) => {
      const { glosses, source } = resolveSingleGloss(displayToken)
      glosses.forEach((gloss, j) => {
        const item: QueueItem = {
          id: nextId(),
          gloss,
          displayToken,
          sentenceIndex,
          tokenIndex: globalToken,
          source: j === 0 ? source : 'fingerspell',
          isFingerSpell: glosses.length > 1,
        }
        items.push(item)
        flatQueue.push(item)
      })
      globalToken += 1
      allDisplay.push(displayToken)
    })

    sentences.push({ raw, displayTokens: sov, items })
  })

  return { sentences, flatQueue, displayTokens: allDisplay }
}

/** Memoization helper: cache plans by input string */
const planCache = new Map<string, ParagraphPlan>()
const MAX_CACHE = 40

export function planParagraphMemo(text: string): ParagraphPlan {
  const key = text.trim()
  const hit = planCache.get(key)
  if (hit) return hit
  const plan = planParagraph(key)
  if (planCache.size > MAX_CACHE) {
    const first = planCache.keys().next().value
    if (first) planCache.delete(first)
  }
  planCache.set(key, plan)
  return plan
}

export function glossToSigmlPath(gloss: string): string {
  const stem = gloss.length === 1 ? gloss.toUpperCase() : gloss.toLowerCase()
  return `/SignFiles/${stem}.sigml`
}
