<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
const props=defineProps({id:{type:String,required:true},markable:{type:Boolean,default:false}})
const size=ref(18),read=ref(false),ready=ref(false)
const readWarning=ref(''),fontWarning=ref('')
const storageWarning=computed(()=>[readWarning.value,fontWarning.value].filter(Boolean).join(' '))
const key='story-shelf:read:v1',fontKey='story-shelf:font:v1'
const preferencesEvent='story-shelf:preferences-changed'

function readIds(){
  const raw=localStorage.getItem(key)
  if(raw===null)return []
  const values=JSON.parse(raw)
  // Refuse to overwrite an unexpected payload, even when its JSON is valid.
  if(!Array.isArray(values)||values.some(value=>typeof value!=='string'))throw new Error('Invalid reading records')
  return values
}
function loadRead(){
  try{read.value=readIds().includes(props.id);readWarning.value=''}
  catch{read.value=false;readWarning.value='无法读取阅读记录，原数据已保留。'}
}
function applyFont(){document.documentElement.style.setProperty('--reading-font-size',`${size.value}px`)}
function loadFont(){
  try{
    const raw=localStorage.getItem(fontKey),stored=Number(raw)
    size.value=raw!==null&&Number.isInteger(stored)&&stored>=16&&stored<=24?stored:18
    fontWarning.value=''
  }catch{fontWarning.value='当前浏览器无法读取保存的字号。'}
  applyFont()
}
function announce(changedKey){window.dispatchEvent(new CustomEvent(preferencesEvent,{detail:{key:changedKey}}))}
function changeSize(delta){
  size.value=Math.min(24,Math.max(16,size.value+delta));applyFont()
  try{localStorage.setItem(fontKey,String(size.value));fontWarning.value='';announce(fontKey)}
  catch{fontWarning.value='字号仅在当前页面生效。'}
}
function toggleRead(){
  try{
    // Merge with the latest stored IDs, not a snapshot from a previous chapter.
    const values=new Set(readIds())
    values.has(props.id)?values.delete(props.id):values.add(props.id)
    localStorage.setItem(key,JSON.stringify([...values]))
    read.value=values.has(props.id);readWarning.value='';announce(key)
  }catch{readWarning.value='无法保存阅读记录，原数据已保留。'}
}
function syncPreferences(event){
  const changedKey=event.type==='storage'?event.key:event.detail?.key
  if(changedKey===null||changedKey===key)loadRead()
  if(changedKey===null||changedKey===fontKey)loadFont()
}
function reload(){loadRead();loadFont()}
watch(()=>props.id,()=>{if(ready.value)loadRead()},{flush:'sync'})
onMounted(()=>{
  reload();ready.value=true
  window.addEventListener('storage',syncPreferences)
  window.addEventListener(preferencesEvent,syncPreferences)
  window.addEventListener('focus',reload)
})
onUnmounted(()=>{
  window.removeEventListener('storage',syncPreferences)
  window.removeEventListener(preferencesEvent,syncPreferences)
  window.removeEventListener('focus',reload)
})
</script>
<template>
  <div class="reading-tools" aria-label="阅读设置">
    <div class="font-controls"><span>字号</span><button :disabled="!ready||size<=16" @click="changeSize(-1)" aria-label="缩小字号">A−</button><output aria-live="polite">{{size}}</output><button :disabled="!ready||size>=24" @click="changeSize(1)" aria-label="放大字号">A＋</button></div>
    <button v-if="markable" :disabled="!ready" :aria-pressed="read" @click="toggleRead">{{read?'已读 · 撤销':'标记已读'}}</button>
  </div>
  <p v-if="storageWarning" class="storage-warning" role="status">{{storageWarning}}</p>
</template>
