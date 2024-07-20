<template>
  <Teleport to="body" :disabled="!isFullScreen">
    <div
      :class="[
        context.attrs.class,
        'vmo-monaco-editor-container',
        computedMonacoEditorOption.theme == 'vs-dark' ? 'dark' : 'light',
        isFullScreen ? 'isFullScreen' : ''
      ]"
      :style="mergeDeepRight(context.attrs?.style || {}, isFullScreen ? { zIndex: zIndex } : {})">
      <slot v-if="context.slots.default"></slot>
      <slot v-if="!!prefix || context.slots.prefix" name="prefix" :option="computedMonacoEditorOption">
        <div :class="['prefix']">
          <span v-html="prefix" class="extra-code"></span>
        </div>
      </slot>
      <div ref="MonacoEditorRef" class="ide-container"></div>
      <slot v-if="!!suffix || context.slots.suffix" name="suffix" :option="computedMonacoEditorOption">
        <div :class="['suffix']">
          <span v-html="suffix" class="extra-code"></span>
        </div>
      </slot>
    </div>
  </Teleport>
</template>

<style lang="css">
.vmo-monaco-editor-container {
  @apply flex-col flex;
}
.vmo-monaco-editor-container.isFullScreen {
  @apply !w-full !h-full z-10 absolute;
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
  @apply flex-grow w-0 flex flex-row overflow-hidden text-ellipsis select-all;
}
.vmo-monaco-editor-container .ide-container {
  @apply flex flex-col h-0 flex-grow;
}
</style>

<script lang="ts">
import { defineComponent, ref, shallowRef, onMounted, watch, computed, readonly, nextTick } from 'vue'
import { mergeDeepRight, equals, clone } from 'ramda'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType, StyleValue } from 'vue'
import * as Monaco from 'monaco-editor'
import { vmoMonacoEditorDefaultOption } from './config'

export default defineComponent({
  name: 'vmo-monaco-editor',
  inheritAttrs: false,
  props: {
    prefix: {
      // 前置内容
      type: String as PropType<string>,
      default: '(()=>{})'
    },
    modelValue: {
      // 代码内容
      type: String as PropType<string>,
      default: 'const aa:number = 12;'
    },
    suffix: {
      // 后置内容
      type: String as PropType<string>,
      default: '};'
    },
    needConfirm: {
      // 是否需要触发确认才能提交代码
      type: Boolean as PropType<boolean>,
      default: false
    },
    bidibind: {
      // 是否双向绑定，当 props.modelValue 在外部发生变化时，也会同步触发代码编辑内容变化
      type: Boolean as PropType<boolean>,
      default: true
    },
    zIndex: {
      // 全屏模式时，其z-index 的值
      type: Number as PropType<number>,
      default: 99
    },
    monacoOptions: {
      // monaco-editor 配置
      type: Object as PropType<
        Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>
      >,
      default: () => ({})
    }
  },
  emits: ['change', 'update:modelValue', 'focuse', 'blur'],
  setup(props, context) {
    const isFullScreen = ref(false as any)
    const innerValue = ref('')
    const MonacoEditorRef = shallowRef(null as any)
    const monacoEditorInstance = shallowRef(null as null | Monaco.editor.IStandaloneCodeEditor)
    const monacoEditorOptions = ref(
      {} as Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>
    )
    const computedMonacoEditorOption = computed(() => {
      monacoEditorOptions.value
      return JSON.parse(JSON.stringify(mergeDeepRight(vmoMonacoEditorDefaultOption, monacoEditorOptions.value)))
    })
    watch(
      () => props.monacoOptions,
      (n, o) => {
        if (!!n && !equals(n, o)) {
          monacoEditorOptions.value = clone(n)
        }
      },
      { immediate: true, deep: true }
    )
    watch(
      () => computedMonacoEditorOption.value,
      n => {
        if (n) {
          monacoEditorInstance.value?.updateOptions(computedMonacoEditorOption.value)
          // initMonacoEditor(innerValue.value)
        }
      }
    )
    // 当外部内容属性变化时，及时更新内部的编辑内容
    watch(
      () => props.modelValue,
      n => {
        if (!!n && props.bidibind && n != innerValue.value) {
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
    /**
     * 重置MonacoEditor的配置
     * @param options 配置
     */
    function resetMonacoEditorOptions(options: Partial<Monaco.editor.IStandaloneEditorConstructionOptions>) {
      console.log(options, 'resetMonacoEditorOptions')
      monacoEditorOptions.value = mergeDeepRight(monacoEditorOptions.value, options) as Partial<
        Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }
      >
    }
    /**
     * 刷新 MonacoEditor
     */
    function refreshMonacoEditor() {
      initMonacoEditor(innerValue.value)
    }
    /**
     * 全屏切换
     */
    function fullscreenSwitch() {
      isFullScreen.value = !isFullScreen.value
    }
    /**
     * 全屏切换
     */
    function commit() {
      context.emit('update:modelValue', innerValue.value)
      context.emit('change', innerValue.value)
    }
    /**
     * 切换编辑器语言
     * @param language
     */
    function changeLanguage(language: string) {
      const model = monacoEditorInstance.value?.getModel()
      !!model && Monaco.editor.setModelLanguage(model, language)
    }
    return {
      context,
      MonacoEditorRef,
      isFullScreen,
      // theme: computedMonacoEditorOption.value.theme,
      computedMonacoEditorOption,
      innerValue,
      monacoEditorOptions,
      mergeDeepRight,
      insertCodeString,
      fullscreenSwitch,
      resetMonacoEditorOptions,
      refreshMonacoEditor,
      changeLanguage,
      commit
    }
  }
})
</script>
