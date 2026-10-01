import fs from 'node:fs'
import path from 'node:path'
import { root, books, exceptions, listChapters } from './content-lib.mjs'

const release = process.argv.includes('--release')
const ids = new Set(), errors = []
let units = 0, paragraphs = 0
for (const book of books) {
  if (!/^[a-z0-9-]+$/.test(book.id) || ids.has(book.id)) errors.push(`Invalid/duplicate book: ${book.id}`)
  ids.add(book.id)
  if (new URL(book.source).protocol !== 'https:') errors.push(`Invalid source: ${book.id}`)
  const chapters = listChapters(book).filter(c => c.verified)
  const required = exceptions[book.id]?.requiredChapters ?? Array.from({ length: book.chapterCount }, (_, i) => i + 1)
  if (release && required.some(number => !chapters.some(chapter => chapter.number === number))) errors.push(`Incomplete required chapters: ${book.id}`)
  if (exceptions[book.id]?.status === 'original-only' && chapters.length) errors.push(`Original-only book contains translations: ${book.id}`)
  for (const chapter of chapters) {
    if (/\uFFFD|[\x00-\x08\x0b-\x0c\x0e-\x1f]/.test(chapter.body)) errors.push(`Damaged/control character: ${chapter.file}`)
    const marked = [...chapter.body.matchAll(/<!--\s*(p\d+)\s*-->/g)].map(m => m[1])
    if (!marked.length || new Set(marked).size !== marked.length) errors.push(`Missing/duplicate paragraph IDs: ${chapter.file}`)
    const source = path.join(root, 'private/sources', book.id, `${chapter.key}.json`)
    if (fs.existsSync(source)) {
      const original = JSON.parse(fs.readFileSync(source, 'utf8'))
      const expected = original.blocks.map(b => b.id)
      if (JSON.stringify(expected) !== JSON.stringify(marked)) errors.push(`Source/translation paragraph mismatch: ${chapter.file}`)
    } else if (release) errors.push(`Local source evidence missing: ${book.id}/${chapter.key}`)
    for (const match of chapter.body.matchAll(/(?:src="|!\[[^\]]*\]\()((?:\/media\/)[^"\s)]+)/g)) {
      if (!fs.existsSync(path.join(root, 'docs/public', match[1].slice(1)))) errors.push(`Missing image: ${match[1]}`)
    }
    const html = path.join(root, 'docs/.vitepress/dist/books', book.id, `${chapter.key}.html`)
    if (release && !fs.existsSync(html)) errors.push(`Missing built chapter: ${html}`)
    units++; paragraphs += marked.length
  }
  if (!fs.existsSync(path.join(root,'docs/books',book.id,'index.md'))) errors.push(`Missing book page: ${book.id}`)
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`Validated ${books.length} books, ${units} translated units, ${paragraphs} aligned blocks${release ? ' for release' : ''}.`)
