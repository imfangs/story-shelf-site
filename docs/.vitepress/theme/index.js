import DefaultTheme from 'vitepress/theme'
import BookShelf from './components/BookShelf.vue'
import ReadingTools from './components/ReadingTools.vue'
import './style.css'
export default { extends: DefaultTheme, enhanceApp({app}) { app.component('BookShelf',BookShelf); app.component('ReadingTools',ReadingTools) } }
