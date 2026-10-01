import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const books=JSON.parse(fs.readFileSync(path.join(root,'content/books.json'),'utf8'))
const ids=new Set()
for(const b of books){
 if(!/^[a-z0-9-]+$/.test(b.id)||ids.has(b.id))throw Error(`Invalid or duplicate id: ${b.id}`)
 ids.add(b.id)
 if(new URL(b.source).protocol!=='https:')throw Error(`Invalid source: ${b.id}`)
 if(!Number.isInteger(b.chapterCount)||b.chapterCount<0||b.chapterCount>3)throw Error(`Invalid count: ${b.id}`)
 const page=path.join(root,'docs/books',b.id,'index.md');if(!fs.existsSync(page))throw Error(`Missing page: ${b.id}`)
 if(!fs.readFileSync(page,'utf8').includes(b.source))throw Error(`Missing attribution: ${b.id}`)
}
const dist=path.join(root,'docs/.vitepress/dist')
if(fs.existsSync(dist)){for(const b of books)if(!fs.existsSync(path.join(dist,'books',b.id,'index.html')))throw Error(`Missing built book: ${b.id}`)}
console.log(`Validated ${books.length} unique books, chapter targets and source attribution.`)
