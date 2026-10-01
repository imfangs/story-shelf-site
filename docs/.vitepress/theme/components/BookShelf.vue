<script setup>
import {computed, ref} from 'vue'
import books from '../../../../content/library.json'
const query=ref(''), category=ref('全部')
const categories=['全部','奇幻与科幻','都市与校园','漫画与短篇']
const filtered=computed(()=>books.filter(b=>(category.value==='全部'||b.category===category.value)&&[b.title,b.chinese,b.author,b.summary].join(' ').toLowerCase().includes(query.value.trim().toLowerCase())))
</script>
<template>
  <div class="shelf-controls">
    <label class="search-label"><span>找一本故事</span><input v-model="query" type="search" placeholder="书名、作者或关键词" aria-label="搜索书名、作者或关键词"></label>
    <label class="category-label"><span>题材</span><select v-model="category" aria-label="选择题材"><option v-for="item in categories" :key="item">{{item}}</option></select></label>
  </div>
  <p class="results" aria-live="polite">{{filtered.length}} 部作品 · {{filtered.filter(book=>book.readyChapters>0).length}} 部已有中文试读</p>
  <div class="book-list" aria-label="作品列表">
    <article v-for="book in filtered" :key="book.id" class="book-row">
      <div class="book-side"><span>{{book.category}}</span><span>{{book.format}}</span></div>
      <div class="book-main">
        <h2><a :href="`/books/${book.id}/`">{{book.title}}</a></h2>
        <p class="book-subtitle">{{book.chinese}} <span aria-hidden="true">·</span> {{book.author}}</p>
        <p class="book-summary">{{book.summary}}</p>
        <div class="book-links"><a v-if="book.firstReadHref" :href="book.firstReadHref">开始阅读 · {{book.readyChapters}}{{book.unit}}</a><a :href="`/books/${book.id}/`">作品介绍与目录</a><a v-if="book.originalOnly" :href="book.source" target="_blank" rel="noopener noreferrer">阅读原作 <span aria-hidden="true">↗</span></a></div>
      </div>
    </article>
    <div v-if="!filtered.length" class="empty-results"><p>没有找到这本故事。</p><button @click="query='';category='全部'">回到全部作品</button></div>
  </div>
</template>
