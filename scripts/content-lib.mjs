import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
export const books = readJSON('content/books.json')
export const exceptions = readJSON('content/exceptions.json')
export const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

export function readChapter(book, number) {
  const key = String(number).padStart(2, '0')
  const file = path.join(root, 'content/chapters', book.id, `${key}.md`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw Error(`Missing frontmatter: ${file}`)
  const meta = Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map(line => {
    const index = line.indexOf(':')
    return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
  }))
  let validSource = false
  try { validSource = new URL(meta.source).protocol === 'https:' } catch {}
  if (!['translation', 'excerpt', 'guide'].includes(meta.kind) || !validSource) throw Error(`Invalid chapter metadata: ${file}`)
  if (meta.kind === 'translation' && !['user-provided', 'licensed'].includes(meta.provenance)) throw Error(`Missing provenance: ${file}`)
  if (meta.kind === 'excerpt') {
    if (meta.provenance !== 'licensed') throw Error(`Missing excerpt provenance: ${file}`)
    if (!/^\d{2}-selection\.json$/.test(meta.selection || '') || meta.selection !== `${key}-selection.json`) throw Error(`Invalid excerpt selection filename: ${file}`)
  }
  if (!match[2].trim()) throw Error(`Empty chapter: ${file}`)
  const defaultTitle = book.format === '短篇小说' ? '全文' : `第 ${number} ${book.format === '漫画' ? '话' : '章'}`
  const title = meta.title || defaultTitle
  return { key, number, file, raw, meta, title: meta.kind === 'excerpt' && !title.includes('节选') ? `${title}（节选）` : title, body: match[2].trim(), verified: meta.verified === 'true', href: `/books/${book.id}/${key}` }
}

export function listChapters(book) {
  return Array.from({ length: book.chapterCount }, (_, i) => readChapter(book, i + 1)).filter(Boolean)
}
