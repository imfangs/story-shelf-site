<script setup>
import {onMounted, onUnmounted, ref} from 'vue'
const props=defineProps({id:{type:String,required:true},markable:{type:Boolean,default:false}})
const size=ref(18),read=ref(false),ready=ref(false), storageWarning=ref('')
const key='story-shelf:read:v1',fontKey='story-shelf:font:v1'
function load(){try{const stored=JSON.parse(localStorage.getItem(key)||'[]');read.value=Array.isArray(stored)&&stored.includes(props.id)}catch{read.value=false;storageWarning.value='当前浏览器无法保存阅读状态。'}}
function applyFont(){document.documentElement.style.setProperty('--reading-font-size',`${size.value}px`)}
function changeSize(delta){size.value=Math.min(24,Math.max(16,size.value+delta));applyFont();try{localStorage.setItem(fontKey,String(size.value))}catch{storageWarning.value='字号仅在当前页面生效。'}}
function toggleRead(){try{const raw=JSON.parse(localStorage.getItem(key)||'[]');const values=new Set(Array.isArray(raw)?raw.filter(x=>typeof x==='string'):[]);values.has(props.id)?values.delete(props.id):values.add(props.id);localStorage.setItem(key,JSON.stringify([...values]));read.value=values.has(props.id)}catch{storageWarning.value='当前浏览器无法保存阅读状态。'}}
onMounted(()=>{try{const stored=Number(localStorage.getItem(fontKey));if(Number.isFinite(stored)&&stored>=16&&stored<=24)size.value=stored}catch{}applyFont();load();ready.value=true;window.addEventListener('storage',load)})
onUnmounted(()=>window.removeEventListener('storage',load))
</script>
<template>
  <div class="reading-tools" aria-label="阅读设置">
    <div class="font-controls"><span>字号</span><button :disabled="!ready||size<=16" @click="changeSize(-1)" aria-label="缩小字号">A−</button><output aria-live="polite">{{size}}</output><button :disabled="!ready||size>=24" @click="changeSize(1)" aria-label="放大字号">A＋</button></div>
    <button v-if="markable" :disabled="!ready" :aria-pressed="read" @click="toggleRead">{{read?'已读 · 撤销':'标记已读'}}</button>
  </div>
  <p v-if="storageWarning" class="storage-warning" role="status">{{storageWarning}}</p>
</template>
