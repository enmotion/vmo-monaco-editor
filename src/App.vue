<script setup lang="ts">
import { ref } from 'vue'
import { vmoMonacoEditor } from '../index'
const codeContent = ref('const s =12;\nfunction aa(a:number){ return a;}')
</script>

<template>
  <div class="flex flex-row grow-1 h-full">
    <div class="flex-col flex flex-grow w-0 bg-white border p-[10px]">
      <textarea v-model="codeContent" class="border h-[200px]" :rows="4" />
    </div>
    <vmo-monaco-editor
      :model-value="codeContent"
      prefix="function(name){"
      :option-config="{
        theme: 'vs-dark'
      }"
      class="w-[800px]"
      @update:modeValue="codeContent = $event"
      @change="codeContent = $event">
    </vmo-monaco-editor>
    <!-- <vmo-monaco-editor></vmo-monaco-editor> -->
  </div>
</template>

<style>
html,
body {
  height: 100%;
  display: flex;
  flex-grow: 1;
}
</style>
