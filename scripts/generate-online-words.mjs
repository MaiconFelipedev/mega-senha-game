import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const sources = [
  resolve('src/data/wordBank.ts'),
  resolve('src/data/additionalWords.ts'),
]
const output = resolve('supabase/seed.sql')
const groupPattern = /\s{2}([a-z_]+):\s*\{\s*facil:\s*'([^']*)',\s*medio:\s*'([^']*)',\s*dificil:\s*'([^']*)',\s*\},/gu

function normalizeWord(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeText(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
}

function quote(value) {
  return `'${value.replaceAll("'", "''")}'`
}

const rows = new Map()
for (const source of sources) {
  const contents = await readFile(source, 'utf8')
  for (const match of contents.matchAll(groupPattern)) {
    const [, category, easy, medium, hard] = match
    for (const [difficulty, words] of [['facil', easy], ['medio', medium], ['dificil', hard]]) {
      for (const rawWord of words.split('|')) {
        const id = `${category}:${difficulty}:${normalizeWord(rawWord)}`
        rows.set(id, {
          id,
          text: rawWord.toLocaleUpperCase('pt-BR'),
          normalizedText: normalizeText(rawWord),
          category,
          difficulty,
        })
      }
    }
  }
}

if (rows.size < 800) throw new Error(`Banco incompleto: apenas ${rows.size} palavras encontradas.`)

const chunks = [...rows.values()].map((row) => (
  `  (${quote(row.id)}, ${quote(row.text)}, ${quote(row.normalizedText)}, ${quote(row.category)}, ${quote(row.difficulty)})`
))
const sql = `-- Gerado por scripts/generate-online-words.mjs a partir do banco local.\n` +
  `-- Não editar manualmente. Total: ${rows.size} palavras.\n\n` +
  `insert into public.online_words (id, text, normalized_text, category, difficulty)\nvalues\n` +
  `${chunks.join(',\n')}\n` +
  `on conflict (id) do update set\n` +
  `  text = excluded.text,\n` +
  `  normalized_text = excluded.normalized_text,\n` +
  `  category = excluded.category,\n` +
  `  difficulty = excluded.difficulty;\n`

await writeFile(output, sql, 'utf8')
console.log(`Seed gerado com ${rows.size} palavras em ${output}`)
