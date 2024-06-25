<template>
  <div class="bg-white w-[800px] flex-col flex p-[20px]">
    <div ref="MonacoEditorRef" class="flex-grow h-0 border"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, shallowRef, computed, onBeforeUnmount, onMounted, nextTick, watch, getCurrentInstance} from 'vue'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType, Ref } from 'vue'
import * as R from 'ramda'
import * as Monaco from 'monaco-editor'
// import { useFormItem } from 'element-plus'
// import MonacoUiBoard from './widgets/monaco-ui-board.vue'
// import { useGenerateUiOptions } from './use.lib/'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

if (window.MonacoEnvironment == undefined) {
  window.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'typescript' || label === 'javascript') return new TsWorker() //出于不明原因，vite打包会出现 过早已存在的复制问题，需要暂时注释该行代码
      if (label === 'json') return new JsonWorker()
      if (label === 'css') return new CssWorker()
      if (label === 'html') return new HtmlWorker()
      return new EditorWorker()
    }
  }
}

export default defineComponent({
  name: 'vmo-monaco-editor',
  inheritAttrs: false,
  props: {
    option: {
      type: Object as PropType<Record<string, any>>
    }
  },
  setup(props, context) {
    const MonacoEditorRef = shallowRef(null as any)
    const monacoEditorInstance = shallowRef(null as any)
    onMounted(() => {
      initMonacoEditor()
    })
    function initMonacoEditor() {
      monacoEditorInstance.value = Monaco.editor.create(MonacoEditorRef.value, {
        value: 'aaaa',
        language: 'typescript'
      })
    }
    return {
      MonacoEditorRef
    }
  }
})
</script>
