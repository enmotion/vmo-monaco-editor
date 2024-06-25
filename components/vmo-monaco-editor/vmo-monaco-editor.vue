<template>
  <div class="bg-white w-[800px] flex-col flex">
    <div class="bg-[#1C1C1C] h-[40px] text-white px-[63px] flex-row items-center flex text-sm">aaa</div>
    <div ref="MonacoEditorRef" class="flex-grow h-0"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef, onMounted} from 'vue'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType} from 'vue'
import * as R from 'ramda'
import * as Monaco from 'monaco-editor'
// import { useFormItem } from 'element-plus'
// import MonacoUiBoard from './widgets/monaco-ui-board.vue'
// import { useGenerateUiOptions } from './use.lib/'
//@ts-ignore
import { initMonacoEnvironment } from '@lib/monaco-editor-inti';

initMonacoEnvironment();

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
    console.log(props,context)
    onMounted(() => {
      initMonacoEditor()
    })
    function initMonacoEditor() {
      monacoEditorInstance.value = Monaco.editor.create(MonacoEditorRef.value, {
        value: 'aaaa',
        theme:'vs-dark',
        language: 'html'
      })
    }
    return {
      R,
      MonacoEditorRef,
    }
  }
})
</script>
