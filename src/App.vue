<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoDiffEditor, VmoMonacoEditor, VmoMonacoUi, useReminderPlugin } from '../index'
import * as Monaco from 'monaco-editor'
import fontSizeInput from '@comps/vmo-monaco-ui/controls/font-size-input.vue'
import themeToggle from '@comps/vmo-monaco-ui/controls/theme-toggle.vue'
import minimapToggle from '@comps/vmo-monaco-ui/controls/minimap-toggle.vue'
import diffReview from '@comps/vmo-monaco-ui/controls/diff-review.vue'
import commitButton from '@comps/vmo-monaco-ui/controls/commit-button.vue'
// initMonacoEnvironment()
const codeContent = ref('SELECT * FROM table_name')
const codeContent2 = ref('SELECT * FROM table_name')
const diffDisplayMode = ref<'original' | 'modified' | 'diff'>('diff')
const diffViewMode = ref<'side-by-side' | 'inline'>('side-by-side')
const originalContent = ref(`项目上线前，产品团队需要完成一次完整的文字校对工作。

本次校对的目标，是确认页面中的说明文本是否准确表达了功能边界，并且保证用户在阅读之后，可以理解每一个操作入口的用途。

在旧版本文案中，部分语句过于口语化，步骤说明也缺少必要的上下文。例如，用户看到“提交”按钮时，并不知道提交后会立即生效，还是进入待审核状态。

另外，帮助说明中对异常场景的描述较少。当网络失败、权限不足、或数据为空时，页面只给出简短提示，无法帮助用户判断下一步应该怎么处理。

因此，我们需要在保留原有语义的基础上，对段落结构、表达顺序、以及关键提示进行调整。`)
const modifiedContent = ref(`项目上线前，产品团队需要完成一次完整的文字审阅和校对工作。

本次校对的目标，是确认页面中的说明文本能够准确表达功能边界，并保证用户阅读后，可以理解每一个操作入口的用途和影响范围。

在旧版本文案中，部分语句过于口语化，步骤说明也缺少必要的上下文。例如，用户看到“提交”按钮时，并不知道提交后会立即生效，还是进入待审核流程。

另外，帮助说明中对异常场景的描述较少。当网络失败、权限不足、或数据为空时，页面只给出简短提示，无法帮助用户判断下一步应该如何处理。

因此，我们需要在保留原有语义的基础上，对段落结构、表达顺序、关键提示以及异常说明进行调整，让文字更适合正式发布场景。`)
const sqlReminderGenerator = useReminderPlugin('sql')
const pythonReminderGenerator = useReminderPlugin('python')
const typescriptReminderGenerator = useReminderPlugin()

const vmoMonacoEditorInstance = ref(null as any)
const vmoMonacoEditorInstance2 = ref(null as any)
const vmoMonacoDiffEditorInstance = ref(null as any)
const disabled = ref(true)

const remindConfig = ref([
  {
    language: 'sql',
    extra: {
      properties: ['table_a', 'table_c', '_table_a_username', '_table_a_age'],
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
    <div class="flex-col flex w-[400px] bg-white border p-[10px]">
      <textarea v-model="codeContent" class="border h-[200px]" :rows="4" />
      <div
        @click="
          () => {
            codeContent = ''
            remindConfig = [
              {
                language: 'sql',
                extra: {
                  properties: ['mod', 'table_c', '_table_a_username', '_table_a_age'],
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
      <div
        class="bg-blue-600 p-[10px] text-white rounded cursor-pointer hover:bg-blue-500"
        @click="disabled = !disabled">
        disabled :{{ disabled }}
      </div>
      <div class="mt-[10px] text-xs text-gray-700">Diff display mode</div>
      <div class="flex flex-row gap-[6px] mt-[6px]">
        <button class="border px-[8px] py-[4px]" @click="diffDisplayMode = 'original'">原文</button>
        <button class="border px-[8px] py-[4px]" @click="diffDisplayMode = 'modified'">改后</button>
        <button class="border px-[8px] py-[4px]" @click="diffDisplayMode = 'diff'">Diff</button>
      </div>
      <div class="flex flex-row gap-[6px] mt-[6px]">
        <button class="border px-[8px] py-[4px]" @click="diffViewMode = 'side-by-side'">并排</button>
        <button class="border px-[8px] py-[4px]" @click="diffViewMode = 'inline'">混合</button>
      </div>
      <div class="flex flex-row gap-[6px] mt-[6px]">
        <button class="border px-[8px] py-[4px]" @click="vmoMonacoDiffEditorInstance?.acceptAllChanges()">全部接受</button>
        <button class="border px-[8px] py-[4px]" @click="vmoMonacoDiffEditorInstance?.rejectAllChanges()">全部拒绝</button>
        <button class="border px-[8px] py-[4px]" @click="vmoMonacoDiffEditorInstance?.confirm()">确认</button>
      </div>
      <textarea v-model="originalContent" class="border h-[180px] mt-[10px] text-xs" />
      <textarea v-model="modifiedContent" class="border h-[180px] mt-[10px] text-xs" />
    </div>
    <div class="flex-col flex grow w-0">
      {{ originalContent }}
      {{ codeContent2 }}
      <!-- <vmo-monaco-editor
        ref="vmoMonacoEditorInstance"
        :model-value="codeContent"
        prefix="aaa"
        suffix=""
        :z-index="5000"
        :monaco-options="{
          theme: 'vs-light',
          language: 'sql'
        }"
        :disabled="disabled"
        :bidibind="true"
        :need-confirm="true"
        :remind-config="remindConfig"
        class="flex-grow"
        @update:modelValue="codeContent = $event"
        @change="codeContent = $event">
        <vmo-monaco-ui
          title="Coding-Sql"
          :monaco="[vmoMonacoEditorInstance,vmoMonacoEditorInstance2]"
          :config="{
            theme: true,
            lineNumbers: true,
            minimap: true,
            fontSize: true,
            fullScreen: true
            // languages: ['css', 'typescript', 'sql']
          }"></vmo-monaco-ui>
      </vmo-monaco-editor> -->
      <vmo-monaco-diff-editor
        ref="vmoMonacoDiffEditorInstance"
        v-model:original-value="originalContent"
        v-model:modified-value="modifiedContent"
        :monaco-options="{
          theme: 'vs-light',
          language: 'plaintext',
          wordWrap: 'on',
          fontSize: 14,
          minimap: {
            enabled: false
          }
        }"
        :need-confirm="false"
        :display-mode="diffDisplayMode"
        :diff-view-mode="diffViewMode"
        :editable-original="true"
        :editable-modified="true"
        class="flex-grow border-t border-t-[#88888844]">
        <vmo-monaco-ui
          title="Text-Diff"
          :monaco="[vmoMonacoDiffEditorInstance,vmoMonacoEditorInstance]"
          :config="{
            theme: true,
            lineNumbers: true,
            minimap: true,
            fontSize: true,
            fullScreen: true,
            reviewActions: true
          }">
          <div class="flex-row flex grow items-center justify-between">
            <div>aaa</div>
            <div class="flex-row flex h-[20px]">
              <!-- <commit-button></commit-button> -->
              <minimap-toggle></minimap-toggle>
              <diff-review></diff-review>
              <fontSizeInput class="h-[20px]"></fontSizeInput>
              <theme-toggle></theme-toggle>
              <span @click="modifiedContent='KKEE'">aaa</span>
            </div>
          </div>  
        </vmo-monaco-ui>
      </vmo-monaco-diff-editor>
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
            language: 'sql',
            extra: {}
          }
        ]"
        class="flex-grow border-t border-t-[#88888844]"
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
