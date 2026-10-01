import fs from 'node:fs'
import path from 'node:path'
import { root, books, exceptions, esc, listChapters } from './content-lib.mjs'

const library = [], sidebar = [], status = []
const kindLabels = { translation: '中文译文', excerpt: '节选译文', guide: '中文导读' }
for (const book of books) {
  const dir = path.join(root, 'docs/books', book.id)
  fs.mkdirSync(dir, { recursive: true })
  const originalOnly = exceptions[book.id]?.status === 'original-only'
  const excerptOnly = exceptions[book.id]?.status === 'excerpt-only'
  const ready = originalOnly ? [] : listChapters(book).filter(chapter => chapter.verified && (!excerptOnly || chapter.meta.kind === 'excerpt'))
  const translatedUnits = ready.filter(chapter => chapter.meta.kind === 'translation').length
  const excerptUnits = ready.filter(chapter => chapter.meta.kind === 'excerpt').length
  const readingUnits = translatedUnits + excerptUnits
  const readyKeys = new Set(ready.map(chapter => chapter.key))
  for (const name of fs.readdirSync(dir)) {
    if (/^\d\d\.md$/.test(name) && !readyKeys.has(name.slice(0, 2))) fs.unlinkSync(path.join(dir, name))
  }
  for (const [index, chapter] of ready.entries()) {
    const type = kindLabels[chapter.meta.kind]
    const prev = index ? { text: ready[index - 1].title, link: ready[index - 1].href } : { text: '作品目录', link: `/books/${book.id}/` }
    const next = ready[index + 1] ? { text: ready[index + 1].title, link: ready[index + 1].href } : { text: '返回作品目录', link: `/books/${book.id}/` }
    const front = `---\ntitle: ${JSON.stringify(chapter.title)}\nprev: ${JSON.stringify(prev)}\nnext: ${JSON.stringify(next)}\n---`
    const selectionNote = chapter.meta.kind === 'excerpt' ? '<p class="content-status">本页为所列原章的部分场景，省略处已标注。</p>\n\n' : ''
    const text = `${front}\n\n# ${esc(chapter.title)}\n\n<p class="book-author">${esc(book.title)} · ${esc(book.author)} · ${type}</p>\n\n${selectionNote}<ReadingTools id="${book.id}/${chapter.key}" markable />\n\n<div class="chapter-body">\n\n${chapter.body}\n\n</div>\n\n---\n\n<a href="${esc(chapter.meta.source)}" target="_blank" rel="noopener noreferrer">原文入口</a> · [返回作品目录](/books/${book.id}/)\n`
    fs.writeFileSync(path.join(dir, `${chapter.key}.md`), text)
  }
  const links = [
    `<a href="${esc(book.source)}" target="_blank" rel="noopener noreferrer">打开原作 ↗</a>`,
    book.ebook && `<a href="${esc(book.ebook)}" target="_blank" rel="noopener noreferrer">正版电子书 ↗</a>`,
    book.sample && `<a href="${esc(book.sample)}" target="_blank" rel="noopener noreferrer">官方试读 ↗</a>`
  ].filter(Boolean)
  const items = ready.map(chapter => `<li><a href="${chapter.href}">${esc(chapter.title)}</a><span>${kindLabels[chapter.meta.kind]}</span></li>`)
  const unit = book.format === '漫画' ? '话' : book.format === '短篇小说' ? '篇' : '章'
  const defaultNotice = excerptUnits
    ? `已收录${translatedUnits ? ` ${translatedUnits} ${unit}完整译文及` : ''} ${excerptUnits} 篇节选译文。节选仅包含所列原章的部分场景，省略处已标注。`
    : translatedUnits ? `已收录 ${translatedUnits} ${unit}${book.format === '漫画' ? '，按原站前三次正文更新阅读。图下附中文对白与文字。' : '完整中文译文。'}`
    : ready.length ? `已收录 ${ready.length} 篇中文导读。` : '章节正在整理中。'
  const notice = exceptions[book.id]?.publicNote || defaultNotice
  const chapterList = items.length ? `<ul class="pending-chapters">${items.join('')}</ul>` : ''
  const firstReadLabel = ready[0]?.meta.kind === 'excerpt' ? '阅读第一篇节选' : `从第一${unit}开始读`
  const contentsTitle = excerptUnits && excerptUnits === ready.length ? '节选目录' : book.format === '漫画' ? '分话目录' : '阅读目录'
  const intro = `---\ntitle: ${JSON.stringify(book.title)}\n---\n\n# ${esc(book.title)}\n\n<p class="book-author">${esc(book.chinese)} · ${esc(book.author)}</p>\n\n${book.summary}\n\n${ready.length ? `[${firstReadLabel}](${ready[0].href})\n\n` : ''}## ${contentsTitle}\n\n<p class="content-status">${esc(notice)}</p>\n\n${chapterList}\n\n## 关于这部作品\n\n${book.appeal}\n\n<p class="book-facts">${esc(book.format)} · ${esc(book.category)}<br>${esc(book.note)}</p>\n\n<div class="source-links">${links.join('')}</div>\n\n[返回书架](/)\n`
  fs.writeFileSync(path.join(dir, 'index.md'), intro)
  sidebar.push({ text: book.title, link: `/books/${book.id}/`, ...(ready.length ? {collapsed: true, items: ready.map(c => ({ text: c.title, link: c.href }))} : {}) })
  library.push({ ...book, readyChapters: ready.length, translatedUnits, excerptUnits, readingUnits, firstReadHref: ready[0]?.href, unit, originalOnly, excerptOnly })
  status.push({ id: book.id, requested: book.chapterCount, translated: translatedUnits, translatedUnits, excerptUnits, readingUnits, exception: exceptions[book.id]?.status || null, chapters: ready.map(c => ({ title: c.title, kind: c.meta.kind, href: c.href, source: c.meta.source })) })
}
fs.writeFileSync(path.join(root, 'content/library.json'), JSON.stringify(library, null, 2) + '\n')
fs.writeFileSync(path.join(root, 'docs/.vitepress/sidebar.json'), JSON.stringify(sidebar, null, 2) + '\n')
const publicDir = path.join(root, 'docs/public')
fs.mkdirSync(publicDir, { recursive: true })
const totals = status.reduce((counts, book) => ({ translatedUnits: counts.translatedUnits + book.translatedUnits, excerptUnits: counts.excerptUnits + book.excerptUnits, readingUnits: counts.readingUnits + book.readingUnits }), { translatedUnits: 0, excerptUnits: 0, readingUnits: 0 })
fs.writeFileSync(path.join(publicDir, 'content-status.json'), JSON.stringify({ books: status, ...totals }, null, 2) + '\n')
console.log(`Generated ${books.length} books; ${totals.translatedUnits} verified translated units, ${totals.excerptUnits} excerpt units, ${totals.readingUnits} reading units.`)
