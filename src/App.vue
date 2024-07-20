<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi, useReminderPlugin } from '../index'
import * as Monaco from 'monaco-editor'
// initMonacoEnvironment()
const codeContent = ref('SELECT * FROM table_name')
const sqlReminderGenerator = useReminderPlugin('sql')
const pythonReminderGenerator = useReminderPlugin('python')
const typescriptReminderGenerator = useReminderPlugin()
Monaco.languages.registerCompletionItemProvider(
  'sql',
  sqlReminderGenerator({
    propertys: ['table_a', 'table_c', '_table_a_username', '_table_a_age'],
    methods: [
      'CUSTOME_SUM',
      'MIXER',
      {
        label: 'enmotion',
        documentation: 'sss',
        parameters: [{ name: 'sss', description: 'you need it' }]
      },
      'FLIP'
    ]
  })
)
Monaco.languages.registerCompletionItemProvider(
  'python',
  pythonReminderGenerator({
    propertys: ['user', 'school'],
    methods: [
      'fun1',
      {
        label: 'fund2',
        parameters: [{ name: 'aaa', type: 'int', description: 'akdfkadf' }]
      }
    ]
  })
)
Monaco.languages.registerCompletionItemProvider(
  'typescript',
  typescriptReminderGenerator({
    propertys: ['user', 'school'],
    methods: [
      'fun1',
      {
        label: 'fund2',
        documentation: 'need say something',
        parameters: [{ name: 'names', description: 'this is username params ' }]
      }
    ]
  })
)
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
        prefix=""
        suffix=""
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
          title="Coding-Sql"
          :monaco="vmoMonacoEditorInstance"
          :config="{
            theme: true,
            lineNumbers: true,
            minimap: true,
            fontSize: true,
            fullScreen: true
            // languages: ['css', 'typescript', 'sql']
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
