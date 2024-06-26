<script setup lang="ts">
import { ref } from 'vue'
import { vmoMonacoEditor } from '../index'

const codeContent = ref('')
</script>

<template>
  <div class="flex flex-row grow-1 h-full">
    <div class="flex-col flex flex-grow w-0 bg-white border p-[10px]">
      <input v-model="codeContent" />
    </div>
    <vmo-monaco-editor :model-value="codeContent" :prefix="codeContent" class="w-[800px]"></vmo-monaco-editor>
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
