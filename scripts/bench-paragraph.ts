/**
 * Run: pnpm dlx tsx --tsconfig tsconfig.json scripts/bench-paragraph.ts
 * Prints sentence splits, SOV display tokens, gloss queue, and coverage stats.
 */
import { planParagraph } from '@/utils/glossMapper'
import { SIGML_WORD_SET } from '@/lib/sigml-words'
import { ISL_DATASET } from '@/isl-dataset'

const TEST_PARA = `Hello. I am happy today. I want water and food.
Can you help me please? Thank you. We will go home tomorrow.`

function bench(label: string, text: string) {
  const t0 = performance.now()
  const plan = planParagraph(text)
  const ms = (performance.now() - t0).toFixed(3)

  const sources = Object.create(null) as Record<string, number>
  for (const q of plan.flatQueue) {
    sources[q.source] = (sources[q.source] ?? 0) + 1
  }

  console.log('\n===', label, `(${ms} ms) ===`)
  console.log('Sentences:', plan.sentences.length)
  plan.sentences.forEach((s, i) => {
    console.log(`  [${i}]`, JSON.stringify(s.raw.slice(0, 80) + (s.raw.length > 80 ? '…' : '')))
    console.log('      SOV:', s.displayTokens.join(' '))
  })
  console.log('Display tokens (all):', plan.displayTokens.join(' | '))
  console.log(
    'Gloss queue:',
    plan.flatQueue.map((q) => `${q.gloss}(${q.source[0]})`).join(' → '),
  )
  console.log('Queue length:', plan.flatQueue.length, '| Resolution mix:', sources)
}

console.log('Corpus: SIGML stems', SIGML_WORD_SET.size, '| ISL_DATASET rows', ISL_DATASET.length)

bench('Default test paragraph', TEST_PARA)

bench('Short + numbers', 'I see three birds. The time is good.')

bench('Unknown word (fingerspell path)', 'The xylophone is loud.')

bench('Hindi token in English sentence', 'I said नमस्ते to my teacher.')
