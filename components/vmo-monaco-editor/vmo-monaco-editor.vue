<template>
  <div
    :class="[
      context.attrs.class,
      'vmo-monaco-editor-container',
      computedMonacoEditorOption.theme == 'vs-dark' ? 'dark' : 'light'
    ]"
    :style="((context.attrs.style||{}) as StyleValue)">
    <div v-if="!!prefix" :class="['prefix']">
      <span v-html="prefix" class="extra-code"></span>
    </div>
    <div ref="MonacoEditorRef" class="ide-container"></div>
    <div v-if="!!suffix" :class="['suffix']">
      <span v-html="suffix" class="extra-code"></span>
    </div>
  </div>
</template>

<style lang="css">
.vmo-monaco-editor-container {
  @apply flex-col flex;
}
.vmo-monaco-editor-container.dark,
.vmo-monaco-editor-container.dark {
  @apply bg-[#1C1C1C] text-gray-400;
}
.vmo-monaco-editor-container.light,
.vmo-monaco-editor-container.light {
  @apply bg-[#FFFFFF] text-gray-500;
}
.vmo-monaco-editor-container .prefix,
.vmo-monaco-editor-container .suffix {
  @apply flex-row items-center flex text-xs px-[28px] py-[10px];
}
.vmo-monaco-editor-container .extra-code {
  @apply flex-grow w-0 flex flex-row overflow-hidden text-ellipsis;
}
.vmo-monaco-editor-container .ide-container {
  @apply flex flex-col h-0 flex-grow;
}
</style>

<script lang="ts">
import { defineComponent, ref, shallowRef, onMounted, watch, computed, readonly } from 'vue'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType, StyleValue } from 'vue'
import { mergeDeepRight, clone } from 'ramda'
import * as Monaco from 'monaco-editor'
import { vmoMonacoEditorDefaultOption } from './config'
// import { useFormItem } from 'element-plus'
// import MonacoUiBoard from './widgets/monaco-ui-board.vue'
// import { useGenerateUiOptions } from './use.lib/'
import { initMonacoEnvironment } from '@lib/monaco-editor-inti'

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
    needConfirm: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    optionConfig: {
      type: Object as PropType<
        Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>
      >,
      default: () => ({})
    }
  },
  emits: ['change', 'update:modelValue', 'focuse', 'blur'],
  setup(props, context) {
    const timer = ref(null as any)
    const innerValue = ref('')
    const MonacoEditorRef = shallowRef(null as any)
    const monacoEditorInstance = shallowRef(null as null | Monaco.editor.IStandaloneCodeEditor)
    const computedMonacoEditorOption = computed(() => {
      return JSON.parse(JSON.stringify(mergeDeepRight(vmoMonacoEditorDefaultOption, props.optionConfig)))
    })
    watch(
      () => computedMonacoEditorOption.value,
      n => {
        if (n) {
          initMonacoEditor(innerValue.value)
        }
      }
    )
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
    /**
     * 编辑器初始化
     * @param codeValue 编写的代码
     */
    function initMonacoEditor(codeValue: string) {
      innerValue.value = codeValue
      monacoEditorInstance.value?.dispose()
      monacoEditorInstance.value = Monaco.editor.create(
        MonacoEditorRef.value,
        mergeDeepRight(computedMonacoEditorOption.value as Monaco.editor.IStandaloneEditorConstructionOptions, {
          value: codeValue
        })
      )
      /**
       * 当编辑器完成布局时，触发格式化
       */
      monacoEditorInstance.value?.onDidLayoutChange(() => {
        monacoEditorInstance.value?.trigger('anyString', 'editor.action.formatDocument', null) // 格式化代码
      })
      /**
       * 当编辑器编辑时，更新内部的绑定值
       */
      monacoEditorInstance.value?.onDidChangeModelContent((event: Monaco.editor.IModelContentChangedEvent) => {
        innerValue.value = monacoEditorInstance.value?.getValue() || ''
        !props.needConfirm && context.emit('update:modelValue', innerValue.value)
      })
      /**
       * 当编辑器获得焦点时，触发事件
       */
      monacoEditorInstance.value?.onDidFocusEditorText(() => {
        context.emit('focuse')
      })
      /**
       * 当编辑器失去焦点时，触发change
       */
      monacoEditorInstance.value?.onDidBlurEditorText(() => {
        context.emit('blur') // 直接触发失焦事件
        !props.needConfirm && context.emit('change', innerValue.value)
      })
    }
    /**
     * 插入代码片段
     * @param codeString 插入的代码文本
     */
    function insertCodeString(codeString: string) {
      const position = monacoEditorInstance.value?.getPosition()
      if (position) {
        monacoEditorInstance.value?.executeEdits('', [
          {
            range: new Monaco.Range(position?.lineNumber, position?.column, position?.lineNumber, position?.column),
            text: codeString
          }
        ])
      }
    }
    return {
      context,
      MonacoEditorRef,
      // theme: computedMonacoEditorOption.value.theme,
      computedMonacoEditorOption,
      innerValue,
      insertCodeString
    }
  }
})
</script>
