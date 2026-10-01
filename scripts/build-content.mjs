import fs from 'node:fs'
import path from 'node:path'
import { root, books, exceptions, esc, listChapters } from './content-lib.mjs'

const library = [], sidebar = [], status = []
for (const book of books) {
  const dir = path.join(root, 'docs/books', book.id)
  fs.mkdirSync(dir, { recursive: true })
  const originalOnly = exceptions[book.id]?.status === 'original-only'
  const ready = originalOnly ? [] : listChapters(book).filter(chapter => chapter.verified)
  const readyKeys = new Set(ready.map(chapter => chapter.key))
  for (const name of fs.readdirSync(dir)) {
    if (/^\d\d\.md$/.test(name) && !readyKeys.has(name.slice(0, 2))) fs.unlinkSync(path.join(dir, name))
  }
  for (const [index, chapter] of ready.entries()) {
    const type = chapter.meta.kind === 'translation' ? '中文译文' : '中文导读'
    const prev = index ? { text: ready[index - 1].title, link: ready[index - 1].href } : { text: '作品目录', link: `/books/${book.id}/` }
    const next = ready[index + 1] ? { text: ready[index + 1].title, link: ready[index + 1].href } : { text: '返回作品目录', link: `/books/${book.id}/` }
    const front = `---\ntitle: ${JSON.stringify(chapter.title)}\nprev: ${JSON.stringify(prev)}\nnext: ${JSON.stringify(next)}\n---`
    const text = `${front}\n\n# ${chapter.title}\n\n<p class="book-author">${esc(book.title)} · ${esc(book.author)} · ${type}</p>\n\n<ReadingTools id="${book.id}/${chapter.key}" markable />\n\n<div class="chapter-body">\n\n${chapter.body}\n\n</div>\n\n---\n\n[原文入口](${chapter.meta.source}) · [返回作品目录](/books/${book.id}/)\n`
    fs.writeFileSync(path.join(dir, `${chapter.key}.md`), text)
  }
  const links = [
    `<a href="${esc(book.source)}" target="_blank" rel="noopener noreferrer">打开原作 ↗</a>`,
    book.ebook && `<a href="${esc(book.ebook)}" target="_blank" rel="noopener noreferrer">正版电子书 ↗</a>`,
    book.sample && `<a href="${esc(book.sample)}" target="_blank" rel="noopener noreferrer">官方试读 ↗</a>`
  ].filter(Boolean)
  const items = ready.map(chapter => `<li><a href="${chapter.href}">${esc(chapter.title)}</a><span>${chapter.meta.kind === 'translation' ? '译文' : '导读'}</span></li>`)
  const unit = book.format === '漫画' ? '话' : book.format === '短篇小说' ? '篇' : '章'
  const notice = exceptions[book.id]?.publicNote || (ready.length ? `已收录 ${ready.length} ${unit}${book.format === '漫画' ? '，按原站前三次正文更新阅读。图下附中文对白与文字。' : '完整中文内容。'}` : '章节正在整理中。')
  const chapterList = items.length ? `<ul class="pending-chapters">${items.join('')}</ul>` : ''
  const intro = `---\ntitle: ${JSON.stringify(book.title)}\n---\n\n# ${book.title}\n\n<p class="book-author">${esc(book.chinese)} · ${esc(book.author)}</p>\n\n${book.summary}\n\n${ready.length ? `[从第一${unit}开始读](${ready[0].href})\n\n` : ''}## ${book.format === '漫画' ? '分话目录' : '阅读目录'}\n\n<p class="content-status">${esc(notice)}</p>\n\n${chapterList}\n\n## 关于这部作品\n\n${book.appeal}\n\n<p class="book-facts">${esc(book.format)} · ${esc(book.category)}<br>${esc(book.note)}</p>\n\n<div class="source-links">${links.join('')}</div>\n\n[返回书架](/)\n`
  fs.writeFileSync(path.join(dir, 'index.md'), intro)
  sidebar.push({ text: book.title, link: `/books/${book.id}/`, ...(ready.length ? {collapsed: true, items: ready.map(c => ({ text: c.title, link: c.href }))} : {}) })
  library.push({ ...book, readyChapters: ready.length, firstReadHref: ready[0]?.href, unit, originalOnly })
  status.push({ id: book.id, requested: book.chapterCount, translated: ready.filter(c => c.meta.kind === 'translation').length, exception: exceptions[book.id]?.status || null, chapters: ready.map(c => ({ title: c.title, href: c.href, source: c.meta.source })) })
}
fs.writeFileSync(path.join(root, 'content/library.json'), JSON.stringify(library, null, 2) + '\n')
fs.writeFileSync(path.join(root, 'docs/.vitepress/sidebar.json'), JSON.stringify(sidebar, null, 2) + '\n')
const publicDir = path.join(root, 'docs/public')
fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'content-status.json'), JSON.stringify({ books: status, translatedUnits: status.reduce((n,b) => n + b.translated, 0) }, null, 2) + '\n')
console.log(`Generated ${books.length} books; ${status.reduce((n,b) => n + b.translated, 0)} verified translated units.`)
