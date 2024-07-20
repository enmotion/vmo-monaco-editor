<script setup lang="ts">
import { ref } from 'vue'
import {
  VmoMonacoEditor,
  VmoMonacoUi,
  sqlReminderRegisterCompletionItemProvider,
  pythonReminderRegisterCompletionItemProvider
} from '../index'
import * as Monaco from 'monaco-editor'
// initMonacoEnvironment()
const codeContent = ref('SELECT * FROM table_name')

Monaco.languages.registerCompletionItemProvider(
  'sql',
  sqlReminderRegisterCompletionItemProvider({
    propertys: ['table_a', 'table_c', '_table_a_username', '_table_a_age'],
    methods: ['CUSTOME_SUM', 'MIXER', 'ROLLBACK', 'FLIP']
  })
)
// Monaco.languages.registerCompletionItemProvider('python', pythonReminderRegisterCompletionItemProvider(['user']))
const vmoMonacoEditorInstance = ref(null as any)
</script>

<template>
  <div class="flex flex-row grow-1 h-full">
    <div class="flex-col flex flex-grow w-0 bg-white border p-[10px]">
      <textarea v-model="codeContent" class="border h-[200px]" :rows="4" />
    </div>
    <div class="flex-col flex bg-red-100">
      <vmo-monaco-editor
        ref="vmoMonacoEditorInstance"
        :model-value="codeContent"
        prefix="function(name){"
        suffix="};"
        :z-index="5000"
        :monaco-options="{
          theme: 'vs-light',
          language: 'sql'
        }"
        :need-confirm="false"
        class="w-[800px] flex-grow"
        @update:modelValue="codeContent = $event"
        @change="codeContent = $event">
        <vmo-monaco-ui
          :monaco="vmoMonacoEditorInstance"
          :config="{
            theme: true,
            lineNumbers: true,
            minimap: true,
            fontSize: true,
            fullScreen: true,
            languages: ['css', 'typescript', 'sql']
          }"></vmo-monaco-ui>
      </vmo-monaco-editor>
    </div>
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
