<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi, useReminderPlugin } from '../index'
import * as Monaco from 'monaco-editor'
// initMonacoEnvironment()
const codeContent = ref('SELECT * FROM table_name')
const codeContent2 = ref('SELECT * FROM table_name')
const sqlReminderGenerator = useReminderPlugin('sql')
const pythonReminderGenerator = useReminderPlugin('python')
const typescriptReminderGenerator = useReminderPlugin()

const vmoMonacoEditorInstance = ref(null as any)
const vmoMonacoEditorInstance2 = ref(null as any)

const remindConfig = ref([
  {
    lanugage: 'sql',
    extra: {
      propertys: ['table_a', 'table_c', '_table_a_username', '_table_a_age'],
      methods: [
        'CUSTOME_SUM',
        'MIXER',
        {
          label: 'enmotion',
          documentation: 'sss',
          parameters: [
            { name: 'sss', description: 'you need it' },
            { name: 'd', description: 'you need it' }
          ]
        },
        'FLIP'
      ]
    }
  }
] as any)
</script>

<template>
  <div class="flex flex-row grow-1 h-full">
    <div class="flex-col flex flex-grow w-0 bg-white border p-[10px]">
      <textarea v-model="codeContent" class="border h-[200px]" :rows="4" />
      <div
        @click="
          () => {
            codeContent = ''
            remindConfig = [
              {
                lanugage: 'sql',
                extra: {
                  propertys: ['mod', 'table_c', '_table_a_username', '_table_a_age'],
                  methods: [
                    'MOD_SUM',
                    'MOD_MiXER',
                    {
                      label: 'MOD_VOLCANO',
                      documentation: 'sss',
                      parameters: [
                        { name: 'sss', description: 'you need it' },
                        { name: 'd', description: 'you need it' }
                      ]
                    },
                    'MOD_FLIP'
                  ]
                }
              }
            ]
          }
        ">
        aaaa
      </div>
    </div>
    <div class="flex-col flex bg-red-100">
      <vmo-monaco-editor
        ref="vmoMonacoEditorInstance"
        :model-value="codeContent"
        prefix="aaa"
        suffix=""
        :z-index="5000"
        :monaco-options="{
          theme: 'vs-light',
          language: 'sql'
        }"
        :bidibind="true"
        :need-confirm="false"
        :remind-config="remindConfig"
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
      <vmo-monaco-editor
        ref="vmoMonacoEditorInstance2"
        :model-value="codeContent2"
        prefix=""
        suffix=""
        :z-index="5000"
        :monaco-options="{
          theme: 'vs-light',
          fontSize: 14,
          language: 'sql'
        }"
        :need-confirm="false"
        :remind-config="[
          {
            lanugage: 'sql',
            extra: {}
          }
        ]"
        class="w-[800px] flex-grow border-t"
        @update:modelValue="codeContent2 = $event"
        @change="codeContent2 = $event">
        <vmo-monaco-ui
          :monaco="vmoMonacoEditorInstance2"
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
@import url('../assets//iconfont/iconfont.css');
html,
body {
  height: 100%;
  display: flex;
  flex-grow: 1;
}
</style>
