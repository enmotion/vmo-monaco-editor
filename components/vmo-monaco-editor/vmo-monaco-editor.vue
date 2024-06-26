<template>
  <div :class="[context.attrs.class, 'vmo-monaco-editor-container']" :style="((context.attrs.style||{}) as StyleValue)">
    <div v-if="!!prefix" :class="[computedMonacoEditorOption.theme == 'vs-dark' ? 'dark' : 'light', 'prefix']">
      <span v-html="prefix" class="extra-code"></span>
    </div>
    <div ref="MonacoEditorRef" class="ide-container"></div>
    <div v-if="!!suffix" :class="[computedMonacoEditorOption.theme == 'vs-dark' ? 'dark' : 'light', 'suffix']">
      <span v-html="suffix" class="extra-code"></span>
    </div>
  </div>
</template>

<style lang="css">
.vmo-monaco-editor-container {
  @apply flex-col flex;
}
.vmo-monaco-editor-container .prefix.dark,
.vmo-monaco-editor-container .suffix.dark {
  @apply bg-[#1C1C1C] text-gray-400;
}
.vmo-monaco-editor-container .prefix.light,
.vmo-monaco-editor-container .suffix.light {
  @apply bg-[#FFFFFF] text-gray-500;
}
.vmo-monaco-editor-container .prefix,
.vmo-monaco-editor-container .suffix {
  @apply h-[40px] flex-row items-center flex text-xs px-[28px];
}
.vmo-monaco-editor-container .extra-code {
  @apply flex-grow w-0 flex flex-row overflow-hidden text-ellipsis;
}
.vmo-monaco-editor-container .ide-container {
  @apply flex flex-col h-0 flex-grow;
}
</style>

<script lang="ts">
import { defineComponent, shallowRef, onMounted, watch, computed } from 'vue'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType, StyleValue } from 'vue'
import { mergeDeepRight } from 'ramda'
import * as Monaco from 'monaco-editor'
import { vmoMonacoEditorDefaultOption } from './config'
// import { useFormItem } from 'element-plus'
// import MonacoUiBoard from './widgets/monaco-ui-board.vue'
// import { useGenerateUiOptions } from './use.lib/'
import { initMonacoEnvironment } from '@lib/monaco-editor-inti'

initMonacoEnvironment()

export default defineComponent({
  name: 'vmo-monaco-editor',
  inheritAttrs: false,
  props: {
    prefix: {
      type: String as PropType<string>,
      default:
        'function(){fdsafksalkfjsadlfjsaklfasklfjasdjfkljsadfjasdlfjdsalkfjskldfjsdjfsajfasjflkasjfklsadjfklsajfklasjfklsadjfklsjfdsaklfjsadlfjlsdfjslajfklasdfjklsafjlksjal'
    },
    modelValue: {
      type: String as PropType<string>,
      default: 'const aa:number = 12;'
    },
    suffix: {
      type: String as PropType<string>,
      default: '};'
    },
    optionConfig: {
      type: Object as PropType<Partial<Monaco.editor.IStandaloneEditorConstructionOptions>>,
      default: () => ({})
    }
  },
  setup(props, context) {
    const MonacoEditorRef = shallowRef(null as any)
    const monacoEditorInstance = shallowRef(null as null | Monaco.editor.IStandaloneCodeEditor)
    const computedMonacoEditorOption = computed(() => {
      return mergeDeepRight(vmoMonacoEditorDefaultOption, {
        theme: 'vs-light',
        language: 'typescript'
      })
    })
    // 当外部内容属性变化时，及时更新内部的编辑内容
    watch(
      () => props.modelValue,
      n => {
        if (!!n) {
          if (!!monacoEditorInstance.value) {
            monacoEditorInstance.value?.setValue(n)
          } else {
            initMonacoEditor(n)
          }
        }
      }
    )
    onMounted(() => {
      monacoEditorInstance.value?.dispose()
      initMonacoEditor(props.modelValue)
    })
    // 初始化
    function initMonacoEditor(codeValue: string) {
      monacoEditorInstance.value?.dispose()
      monacoEditorInstance.value = Monaco.editor.create(
        MonacoEditorRef.value,
        mergeDeepRight(computedMonacoEditorOption.value, {
          value: codeValue
        })
      )
    }
    return {
      context,
      MonacoEditorRef,
      computedMonacoEditorOption
    }
  }
})
</script>
