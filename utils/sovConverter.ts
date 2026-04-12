const verbs = [
  'eat', 'drink', 'go', 'come', 'take', 'give', 'help', 'teach',
  'learn', 'read', 'write', 'play', 'work', 'see', 'hear', 'say',
  'want', 'need', 'like', 'love', 'have', 'get', 'make', 'do',
  'sleep', 'wake', 'run', 'walk', 'sit', 'stand', 'think', 'know',
  'tell', 'ask', 'call', 'use', 'find', 'leave', 'feel', 'try',
  'start', 'stop', 'open', 'close', 'watch', 'listen', 'speak',
  'buy', 'sell', 'pay', 'meet', 'wait', 'talk', 'understand', 'thank',
]

const auxiliaries = [
  'am', 'is', 'are', 'was', 'were', 'will', 'shall', 'would',
  'can', 'could', 'should', 'may', 'might', 'must', 'do', 'does', 'did',
  'has', 'have', 'had', 'been', 'being',
]

const questionWords = ['how', 'what', 'when', 'where', 'why', 'who', 'which', 'whose']

const contractions: Record<string, string[]> = {
  "i'm": ['i', 'am'],
  "i'll": ['i', 'will'],
  "i'd": ['i', 'would'],
  "you're": ['you', 'are'],
  "you'll": ['you', 'will'],
  "he's": ['he', 'is'],
  "she's": ['she', 'is'],
  "it's": ['it', 'is'],
  "we're": ['we', 'are'],
  "they're": ['they', 'are'],
  "isn't": ['is', 'not'],
  "aren't": ['are', 'not'],
  "wasn't": ['was', 'not'],
  "weren't": ['were', 'not'],
  "don't": ['do', 'not'],
  "doesn't": ['does', 'not'],
  "didn't": ['did', 'not'],
  "won't": ['will', 'not'],
  "wouldn't": ['would', 'not'],
  "can't": ['can', 'not'],
  "couldn't": ['could', 'not'],
  "shouldn't": ['should', 'not'],
  "gonna": ['going', 'to'],
  "wanna": ['want', 'to'],
  "gotta": ['got', 'to'],
}

/** Heuristic SVO → SOV reordering for English-like gloss sequences */
export function convertToSOV(words: string[]): string[] {
  if (words.length < 2) return words

  let expandedWords: string[] = []
  for (const word of words) {
    const lowerWord = word.toLowerCase()
    if (contractions[lowerWord]) {
      expandedWords.push(...contractions[lowerWord])
    } else {
      expandedWords.push(lowerWord)
    }
  }

  let subject: string[] = []
  let verb: string | null = null
  let objects: string[] = []
  let questionWord: string | null = null

  if (questionWords.includes(expandedWords[0])) {
    questionWord = expandedWords[0]
    expandedWords = expandedWords.slice(1)
  }

  let mainVerbIdx = -1
  let auxIdx = -1

  for (let i = 0; i < expandedWords.length; i++) {
    const word = expandedWords[i]

    if (auxiliaries.includes(word) && auxIdx === -1) {
      auxIdx = i
    } else if ((verbs.includes(word) || word.endsWith('ing') || word.endsWith('ed')) && mainVerbIdx === -1) {
      mainVerbIdx = i
      verb = word
    }
  }

  if (auxIdx !== -1) {
    subject = expandedWords.slice(0, auxIdx)

    if (mainVerbIdx > auxIdx) {
      verb = expandedWords[mainVerbIdx]
      objects = expandedWords.slice(mainVerbIdx + 1)
    } else if (auxIdx < expandedWords.length - 1) {
      const nextWord = expandedWords[auxIdx + 1]
      if (nextWord.endsWith('ing') || nextWord.endsWith('ed') || verbs.includes(nextWord)) {
        verb = nextWord
        objects = expandedWords.slice(auxIdx + 2)
      } else {
        objects = expandedWords.slice(auxIdx + 1)
      }
    }
  } else if (mainVerbIdx !== -1) {
    subject = expandedWords.slice(0, mainVerbIdx)
    verb = expandedWords[mainVerbIdx]
    objects = expandedWords.slice(mainVerbIdx + 1)
  } else {
    return questionWord ? [...expandedWords, questionWord] : expandedWords
  }

  const result: string[] = []
  if (subject.length > 0) result.push(...subject)
  if (objects.length > 0) result.push(...objects)
  if (verb) result.push(verb)
  if (questionWord) result.push(questionWord)

  return result.length > 0 ? result : expandedWords
}
