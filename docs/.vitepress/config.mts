import { defineConfig } from 'vitepress'
import books from '../../content/books.json'
export default defineConfig({
  lang: 'zh-CN', title: '故事书架', description: '先读一点，再决定走进哪个故事。',
  cleanUrls: true, appearance: true,
  head: [['meta', {name:'robots', content:'noindex, nofollow'}], ['meta',{name:'theme-color',content:'#fafaf7'}]],
  themeConfig: {
    nav: [{text:'书架',link:'/'},{text:'阅读说明',link:'/about'}],
    sidebar: {'/books/': [{text:'书架',link:'/'},...books.map(book=>({text:book.title, link:`/books/${book.id}/`}))]},
    outline:{label:'本页目录',level:[2,3]}, docFooter:{prev:'上一篇',next:'下一篇'},
    search:{provider:'local',options:{translations:{button:{buttonText:'搜索',buttonAriaLabel:'搜索书籍与章节'},modal:{noResultsText:'没有找到结果',resetButtonTitle:'清除',footer:{selectText:'选择',navigateText:'切换',closeText:'关闭'}}}}},
    skipToContentLabel:'跳到正文', sidebarMenuLabel:'作品目录', returnToTopLabel:'返回顶部',
    darkModeSwitchLabel:'阅读主题', darkModeSwitchTitle:'切换至深色主题', lightModeSwitchTitle:'切换至浅色主题',
    footer:{message:'个人阅读书架 · 保留作者与原作入口'}
  }
})
