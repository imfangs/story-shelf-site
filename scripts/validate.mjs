import fs from 'node:fs'
import path from 'node:path'
import { root, books, exceptions, listChapters } from './content-lib.mjs'

const release = process.argv.includes('--release')
const ids = new Set(), errors = []
let translatedUnits = 0, excerptUnits = 0, paragraphs = 0
for (const book of books) {
  if (!/^[a-z0-9-]+$/.test(book.id) || ids.has(book.id)) errors.push(`Invalid/duplicate book: ${book.id}`)
  ids.add(book.id)
  if (new URL(book.source).protocol !== 'https:') errors.push(`Invalid source: ${book.id}`)
  const allChapters = listChapters(book)
  const chapters = allChapters.filter(c => c.verified)
  const required = exceptions[book.id]?.requiredChapters ?? Array.from({ length: book.chapterCount }, (_, i) => i + 1)
  if (release && required.some(number => !chapters.some(chapter => chapter.number === number))) errors.push(`Incomplete required chapters: ${book.id}`)
  if (exceptions[book.id]?.status === 'original-only' && chapters.length) errors.push(`Original-only book contains translations: ${book.id}`)
  if (exceptions[book.id]?.status === 'excerpt-only' && allChapters.some(c => c.meta.kind !== 'excerpt')) errors.push(`Excerpt-only book contains non-excerpt content: ${book.id}`)
  for (const chapter of chapters) {
    if (/\uFFFD|[\x00-\x08\x0b-\x0c\x0e-\x1f]/.test(chapter.body)) errors.push(`Damaged/control character: ${chapter.file}`)
    const marked = [...chapter.body.matchAll(/<!--\s*(p\d+)\s*-->/g)].map(m => m[1])
    if (!marked.length || new Set(marked).size !== marked.length) errors.push(`Missing/duplicate paragraph IDs: ${chapter.file}`)
    let selectedIds = null
    if (chapter.meta.kind === 'excerpt') {
      const selection = path.join(root, 'private/sources', book.id, chapter.meta.selection)
      if (fs.existsSync(selection)) {
        try {
          const record = JSON.parse(fs.readFileSync(selection, 'utf8'))
          if (!Array.isArray(record.selectedIds) || !record.selectedIds.length || record.selectedIds.some(id => typeof id !== 'string' || !/^p\d+$/.test(id)) || new Set(record.selectedIds).size !== record.selectedIds.length) {
            errors.push(`Invalid/duplicate excerpt selection IDs: ${selection}`)
          } else {
            selectedIds = record.selectedIds
            if (JSON.stringify(selectedIds) !== JSON.stringify(marked)) errors.push(`Selection/excerpt paragraph mismatch: ${chapter.file}`)
          }
          if (record.sourceUrl !== chapter.meta.source) errors.push(`Excerpt selection source URL mismatch: ${selection}`)
        } catch (error) { errors.push(`Invalid excerpt selection JSON: ${selection}: ${error.message}`) }
      } else if (release) errors.push(`Local excerpt selection evidence missing: ${book.id}/${chapter.meta.selection}`)
    }
    const source = path.join(root, 'private/sources', book.id, `${chapter.key}.json`)
    if (fs.existsSync(source)) {
      try {
        const original = JSON.parse(fs.readFileSync(source, 'utf8'))
        const expected = original.blocks.map(b => b.id)
        if (chapter.meta.kind === 'excerpt') {
          if (selectedIds) {
            const selected = new Set(selectedIds)
            if (JSON.stringify(expected.filter(id => selected.has(id))) !== JSON.stringify(selectedIds)) errors.push(`Excerpt selection is not an ordered source subset: ${chapter.file}`)
          }
          if ((original.url || original.sourceUrl) !== chapter.meta.source) errors.push(`Excerpt original source URL mismatch: ${chapter.file}`)
        } else if (JSON.stringify(expected) !== JSON.stringify(marked)) errors.push(`Source/translation paragraph mismatch: ${chapter.file}`)
      } catch (error) { errors.push(`Invalid local source evidence: ${source}: ${error.message}`) }
    } else if (release) errors.push(`Local source evidence missing: ${book.id}/${chapter.key}`)
    for (const match of chapter.body.matchAll(/(?:src="|!\[[^\]]*\]\()((?:\/media\/)[^"\s)]+)/g)) {
      if (!fs.existsSync(path.join(root, 'docs/public', match[1].slice(1)))) errors.push(`Missing image: ${match[1]}`)
    }
    const html = path.join(root, 'docs/.vitepress/dist/books', book.id, `${chapter.key}.html`)
    if (release && !fs.existsSync(html)) errors.push(`Missing built chapter: ${html}`)
    if (chapter.meta.kind === 'translation') translatedUnits++
    if (chapter.meta.kind === 'excerpt') excerptUnits++
    paragraphs += marked.length
  }
  if (!fs.existsSync(path.join(root,'docs/books',book.id,'index.md'))) errors.push(`Missing book page: ${book.id}`)
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`Validated ${books.length} books, ${translatedUnits} translated units, ${excerptUnits} excerpt units, ${translatedUnits + excerptUnits} reading units, ${paragraphs} aligned blocks${release ? ' for release' : ''}.`)
