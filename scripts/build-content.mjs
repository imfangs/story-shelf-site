import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const books=JSON.parse(fs.readFileSync(path.join(root,'content/books.json'),'utf8'))
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
let ready=0
for(const book of books){
 const dir=path.join(root,'docs/books',book.id);fs.mkdirSync(dir,{recursive:true})
 const chapters=[]
 for(let i=1;i<=book.chapterCount;i++){
  const defaultTitle=book.format==='短篇小说'?'全文':`第 ${i} 章`
  const n=String(i).padStart(2,'0'),file=path.join(root,'content/chapters',book.id,`${n}.md`)
  const target=path.join(dir,`${n}.md`)
  if(!fs.existsSync(file)){if(fs.existsSync(target))fs.unlinkSync(target);chapters.push(`<li>${defaultTitle}<span>待添加</span></li>`);continue}
  const raw=fs.readFileSync(file,'utf8'),match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if(!match)throw Error(`Missing frontmatter: ${file}`)
  const meta=Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map(line=>{const p=line.indexOf(':');return [line.slice(0,p).trim(),line.slice(p+1).trim()]}))
  if(!['translation','guide'].includes(meta.kind)||meta.verified!=='true'||!meta.source?.startsWith('https://'))throw Error(`Unverified chapter: ${file}`)
  if(meta.kind==='translation'&&!['user-provided','licensed'].includes(meta.provenance))throw Error(`Missing source provenance: ${file}`)
  if(!match[2].trim())throw Error(`Empty chapter: ${file}`)
  const type=meta.kind==='translation'?'译文':'中文导读'
  const title=meta.title||defaultTitle
  const text=`---\ntitle: ${JSON.stringify(title)}\n---\n\n# ${title}\n\n<p class="book-author">${esc(book.title)} · ${esc(book.author)} · ${type}</p>\n\n<ReadingTools id="${book.id}/${n}" markable />\n\n${match[2].trim()}\n\n---\n\n[原文入口](${meta.source}) · [返回作品目录](/books/${book.id}/)\n`
  fs.writeFileSync(target,text);ready++;chapters.push(`<li><a href="/books/${book.id}/${n}">${esc(title)}</a><span>${type}</span></li>`)
 }
 const intro=`---\ntitle: ${JSON.stringify(book.title)}\n---\n\n# ${book.title}\n\n<p class="book-author">${esc(book.chinese)} · ${esc(book.author)}</p>\n\n<ReadingTools id="${book.id}" />\n\n${book.summary}\n\n## 为什么可能喜欢\n\n${book.appeal}\n\n<p class="book-facts">${esc(book.format)} · ${esc(book.category)}<br>${esc(book.note)}</p>\n\n<div class="source-links"><a href="${esc(book.source)}" target="_blank" rel="noopener noreferrer">打开原作 ↗</a>${book.firstChapter?`<a href="${esc(book.firstChapter)}" target="_blank" rel="noopener noreferrer">原作第一章 ↗</a>`:''}</div>\n\n## ${book.format==='漫画'?'分话阅读':'章节目录'}\n\n${book.format==='漫画'?'本作是漫画，按原站分话阅读。本站尚未添加中文内容。':`<ul class="pending-chapters">${chapters.join('')}</ul>\n\n<p class="content-status">译文与导读会分别标注；待添加章节尚未收录正文。</p>`}\n\n[返回书架](/)\n`
 const extraLinks=[book.ebook?`[正版电子书](${book.ebook})`:'',book.sample?`[官方试读](${book.sample})`:''].filter(Boolean)
 fs.writeFileSync(path.join(dir,'index.md'),extraLinks.length?intro.replace('## 章节目录',`${extraLinks.join(' · ')}\n\n## 章节目录`):intro)
}
console.log(`Generated ${books.length} book pages; ${ready} verified chapters.`)
