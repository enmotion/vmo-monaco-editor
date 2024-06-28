<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi } from '../index'
import * as Monaco from 'monaco-editor'
// initMonacoEnvironment()
const codeContent = ref('SELECT * FROM table_name')

Monaco.languages.registerCompletionItemProvider('sql', {
  provideCompletionItems: function (model, position) {
    var word = model.getWordUntilPosition(position)
    var range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    }
    return {
      suggestions: [
        {
          label: 'SELECT',
          kind: Monaco.languages.CompletionItemKind.Keyword,
          insertText: 'SELECT',
          range: range
        },
        {
          label: 'FROM',
          kind: Monaco.languages.CompletionItemKind.Keyword,
          insertText: 'FROM',
          range: range
        },
        {
          label: 'WHERE',
          kind: Monaco.languages.CompletionItemKind.Keyword,
          insertText: 'WHERE',
          range: range
        },
        {
          label: 'table_name',
          kind: Monaco.languages.CompletionItemKind.Keyword,
          insertText: 'table_name',
          range: range
        }
      ]
    }
  }
})
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
        :monaco-options="{
          theme: 'vs-dark',
          language: 'sql'
        }"
        :need-confirm="true"
        class="w-[800px] flex-grow"
        @update:modeValue="codeContent = $event"
        @change="codeContent = $event">
        <vmo-monaco-ui :monaco="vmoMonacoEditorInstance"></vmo-monaco-ui>
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
