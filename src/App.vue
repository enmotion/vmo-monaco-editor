<script setup lang="ts">
import { vmoMonacoEditor } from '../index'
</script>

<template>
  <div class="flex flex-row grow-1 h-full">
    <div class="flex-col flex flex-grow w-0 bg-white border">cc</div>
    <vmo-monaco-editor></vmo-monaco-editor>
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
