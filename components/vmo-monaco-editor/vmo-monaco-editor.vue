<template>
  <!--
    全屏时把编辑器整体 Teleport 到 body，避免被父级 overflow / transform / z-index 限制。
    非全屏时 disabled Teleport，保持组件仍在原始布局流里。
  -->
  <Teleport to="body" :disabled="!isFullScreen">
    <div
      :class="[
        context.attrs.class,
        'vmo-monaco-editor-container',
        computedMonacoEditorOption.theme == 'vs-dark' ? 'dark' : 'light',
        isFullScreen ? 'isFullScreen' : ''
      ]"
      :style="mergeDeepRight(context.attrs?.style || {}, isFullScreen ? { zIndex: zIndex } : {})">
      <!-- 默认插槽通常用于注入 vmo-monaco-ui 或用户自定义工具栏。 -->
      <slot v-if="context.slots.default"></slot>
      <!-- prefix/suffix 是编辑器外部的附加展示内容，不进入 Monaco model。 -->
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
import { defineComponent, ref, shallowRef, onMounted, onBeforeUnmount, watch, computed, readonly, nextTick } from 'vue'
import { mergeDeepRight, clone, isNil } from 'ramda'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType, StyleValue } from 'vue'
import { useReminderPlugin } from '../../index'
import type { VmoMonacoContext } from '@type'
import * as Monaco from 'monaco-editor'
import { syncMonacoOptions } from '../../use.lib/sync-monaco-options'
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
      default: '//code content gose here...'
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
    remindConfig: {
      type: Array as PropType<{ language?: 'sql' | 'python' | 'groovy'; extra: Partial<VmoMonacoContext> }[]>,
      default: () => []
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false
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
    // 全屏只影响组件容器位置，不直接改变 Monaco 实例本身。
    const isFullScreen = ref(false as any)
    // innerValue 是 Monaco 内部真实内容缓存，用于 needConfirm 场景下延迟提交。
    const innerValue = ref('')
    // Monaco 的 DOM 容器和 editor 实例都不需要深层响应式，shallowRef 可以避免 Vue 递归代理第三方对象。
    const MonacoEditorRef = shallowRef(null as any)
    const monacoEditorInstance = shallowRef(null as null | Monaco.editor.IStandaloneCodeEditor)
    // 自动补全 provider 需要在 remindConfig 更新时 dispose，否则会重复注册同一语言提示。
    const completionProvider = ref([] as Monaco.IDisposable[])
    // 组件内部维护一份可变配置，来源可以是外部 props.monacoOptions，也可以是 UI 控件调用 resetMonacoEditorOptions。
    const monacoEditorOptions = ref(
      {} as Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>
    )
    // 最终配置 = 默认配置 + 当前配置。外部和 UI 控件都只修改 monacoEditorOptions。
    const computedMonacoEditorOption = computed<Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>>(() => {
      monacoEditorOptions.value
      return mergeDeepRight(vmoMonacoEditorDefaultOption, monacoEditorOptions.value)
    })
    let ownedModel: Monaco.editor.ITextModel | null = null
    let mounted = false
    let reminderRevision = 0
    function disposeCompletionProviders() {
      completionProvider.value.forEach(provider => provider.dispose())
      completionProvider.value = []
    }
    function refreshCompletionProviders() {
      const revision = ++reminderRevision
      disposeCompletionProviders()
      nextTick(() => {
        const targetModel = monacoEditorInstance.value?.getModel()
        if (!mounted || revision !== reminderRevision || !targetModel) return
        completionProvider.value = props.remindConfig.map(item => {
          const provider = useReminderPlugin(item.language)(item.extra, targetModel)
          return Monaco.languages.registerCompletionItemProvider(
            item.language || targetModel.getLanguageId(),
            {
              ...provider,
              provideCompletionItems(model, ...args) {
                return model === targetModel ? provider.provideCompletionItems(model, ...args) : { suggestions: [] }
              }
            }
          )
        })
      })
    }
    watch(() => props.remindConfig, refreshCompletionProviders, { deep: true })

    // 保存外部配置快照，区分深层变更和父组件重渲染，保留工具栏的内部选择。
    let previousMonacoOptions: typeof props.monacoOptions | undefined
    watch(
      () => props.monacoOptions,
      n => {
        if (n) {
          monacoEditorOptions.value = syncMonacoOptions(monacoEditorOptions.value, n, previousMonacoOptions)
          previousMonacoOptions = clone(n)
        }
      },
      { immediate: true, deep: true }
    )
    watch(() => computedMonacoEditorOption.value.language, language => {
      const model = monacoEditorInstance.value?.getModel()
      if (model && language && model.getLanguageId() != language) {
        Monaco.editor.setModelLanguage(model, language)
        refreshCompletionProviders()
      }
    })
    // Monaco editor 创建后，大部分配置可以通过 updateOptions 热更新，不需要销毁重建。
    // disabled 也通过 readOnly 合并进同一次 updateOptions，确保外部禁用状态立即生效。
    watch(
      () => [props.disabled, computedMonacoEditorOption.value],
      n => {
        if (n) {
          monacoEditorInstance.value?.updateOptions(
            mergeDeepRight(computedMonacoEditorOption.value, { readOnly: props.disabled })
          )
          // initMonacoEditor(innerValue.value)
        }
      }
    )
    // theme 在 Monaco 内部是全局状态，不能只依赖 updateOptions。
    // 这里单独监听最终 theme，保证外部 monacoOptions.theme 或 UI 控件切换后，Monaco 内部主题也同步变化。
    watch(
      () => computedMonacoEditorOption.value.theme,
      theme => {
        if (theme) {
          Monaco.editor.setTheme(theme)
        }
      },
      { immediate: true }
    )
    // 当外部内容属性变化时，及时更新内部的编辑内容
    watch(
      () => props.modelValue,
      n => {
        if (!isNil(n) && props.bidibind && n != innerValue.value) {
          if (!!monacoEditorInstance.value) {
            monacoEditorInstance.value?.setValue(n)
          } else {
            initMonacoEditor(n)
          }
        }
      }
    )
    onMounted(() => {
      // 避免热更新或重复挂载时残留旧实例。
      mounted = true
      initMonacoEditor(props.modelValue)
    })
    onBeforeUnmount(() => {
      mounted = false
      ++reminderRevision
      disposeCompletionProviders()
      disposeEditor()
    })
    function disposeEditor() {
      const instance = monacoEditorInstance.value
      instance?.dispose()
      ownedModel?.dispose()
      ownedModel = null
      monacoEditorInstance.value = null
    }
    /**
     * 编辑器初始化
     * @param codeValue 编写的代码
     */
    function initMonacoEditor(codeValue: string) {
      innerValue.value = codeValue
      disposeEditor()
      // create 只在初始化/刷新时执行；后续配置变更优先走 updateOptions。
      monacoEditorInstance.value = Monaco.editor.create(
        MonacoEditorRef.value,
        mergeDeepRight(computedMonacoEditorOption.value as Monaco.editor.IStandaloneEditorConstructionOptions, {
          value: codeValue,
          readOnly: props.disabled
        })
      )
      const model = monacoEditorInstance.value.getModel()
      ownedModel = model !== computedMonacoEditorOption.value.model ? model : null
      refreshCompletionProviders()
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
     * 这是暴露给 vmo-monaco-ui 和各个 control 小组件的统一配置入口。
     * 小组件不直接操作 monacoEditorInstance，而是通过这里修改内部配置，再由 watcher 统一同步到 Monaco。
     * @param options 配置
     */
    function resetMonacoEditorOptions(options: Partial<Monaco.editor.IStandaloneEditorConstructionOptions>) {
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
     * 提交当前 Monaco 内容。
     * needConfirm=true 时，编辑过程不会实时 update:modelValue，外部需要通过 commit 主动取值。
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
      resetMonacoEditorOptions({ language })
      refreshCompletionProviders()
    }
    // setup return 的这些字段就是组件实例 ref 能访问到的 public API。
    // vmo-monaco-ui 和 controls 会依赖这层 API，而不是直接触碰 Monaco 原始实例。
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
