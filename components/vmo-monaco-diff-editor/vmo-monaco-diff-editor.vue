<template>
  <!-- 与普通 editor 保持一致：全屏时 Teleport 到 body，避免被父级布局裁剪。 -->
  <Teleport to="body" :disabled="!isFullScreen">
    <div
      :class="[
        context.attrs.class,
        'vmo-monaco-editor-container',
        computedMonacoEditorOption.theme == 'vs-dark' ? 'dark' : 'light',
        isFullScreen ? 'isFullScreen' : ''
      ]"
      :style="mergeDeepRight(context.attrs?.style || {}, isFullScreen ? { zIndex: zIndex } : {})">
      <!-- 默认插槽用于复用 vmo-monaco-ui 或用户自定义工具栏。 -->
      <slot v-if="context.slots.default" :view-mode="currentViewMode"></slot>
      <slot v-if="!!prefix || context.slots.prefix" name="prefix" :option="computedMonacoEditorOption">
        <div :class="['prefix']">
          <span v-html="prefix" class="extra-code"></span>
        </div>
      </slot>
      <div v-show="currentViewMode == 'edit'" ref="MonacoEditorRef" class="ide-container"></div>
      <div v-if="currentViewMode == 'preview'" class="vmo-preview-container">
        <div v-if="!!modifiedInnerValue" class="vmo-preview-source" role="group" aria-label="Preview source">
          <button type="button" :aria-pressed="currentPreviewSource == 'original'" @click="changePreviewSource('original')">正文</button>
          <button type="button" :aria-pressed="currentPreviewSource == 'modified'" @click="changePreviewSource('modified')">提案</button>
        </div>
        <div class="vmo-preview-content">
          <slot name="preview" :content="previewContent" :language="previewLanguage" :source="currentPreviewSource" :theme="computedMonacoEditorOption.theme"></slot>
        </div>
      </div>
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
.vmo-monaco-editor-container .vmo-preview-container {
  @apply flex flex-col flex-grow h-0 min-h-0;
}
.vmo-monaco-editor-container .vmo-preview-source {
  @apply flex flex-row gap-[6px] p-[8px] border-b border-[#88888833];
}
.vmo-monaco-editor-container .vmo-preview-source button {
  @apply px-[8px] py-[4px] rounded border border-[#88888844];
}
.vmo-monaco-editor-container .vmo-preview-source button[aria-pressed='true'] {
  @apply text-[#00BB55] border-[#00BB5588];
}
.vmo-monaco-editor-container .vmo-preview-content {
  @apply flex-grow min-h-0 overflow-auto;
}
.vmo-monaco-editor-container .codicon.codicon-light-bulb.lightbulb-glyph {
  @apply hidden pointer-events-none;
}
.vmo-monaco-editor-container .codicon{
  @apply cursor-pointer
}
</style>

<script lang="ts">
import { defineComponent, ref, shallowRef, onMounted, onBeforeUnmount, onBeforeUpdate, watch, computed, nextTick, getCurrentInstance } from 'vue'
import { mergeDeepRight, isNil } from 'ramda'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType, SlotsType } from 'vue'
import type { VmoMonacoEditorSlots } from '@type'
import * as Monaco from 'monaco-editor'
import { useEditorOptions, useEditorFullscreen } from '../../use.lib/use-editor-state'
import { vmoMonacoEditorDefaultOption } from '../vmo-monaco-editor/config'
import {
  applyLineChange as applyReviewLineChange,
  createReviewActionMaps,
  getNativeDiffAction,
  getReviewActionIndex
} from './review'
import type {
  VmoMonacoAnyDiffEditor,
  VmoMonacoDiffChangePayload,
  VmoMonacoDiffConfirmPayload,
  VmoMonacoViewMode,
  VmoMonacoDiffEditMode,
  VmoMonacoDiffEditor,
  VmoMonacoDiffReviewActionPayload,
  VmoMonacoDiffViewMode,
  VmoMonacoNormalEditor,
  VmoMonacoReviewAction,
  VmoMonacoReviewActionMaps,
  VmoMonacoReviewSide,
  VmoMonacoPreviewSource
} from './types'

const DEFAULT_ORIGINAL_URI = 'vmo-monaco-diff-original'
const DEFAULT_MODIFIED_URI = 'vmo-monaco-diff-modified'

export type {
  VmoMonacoDiffChangePayload,
  VmoMonacoDiffConfirmPayload,
  VmoMonacoViewMode,
  VmoMonacoDiffEditMode,
  VmoMonacoDiffReviewActionPayload,
  VmoMonacoDiffViewMode
} from './types'

export default defineComponent({
  name: 'vmo-monaco-diff-editor',
  inheritAttrs: false,
  slots: Object as SlotsType<VmoMonacoEditorSlots>,
  props: {
    prefix: {
      type: String as PropType<string>,
      default: ''
    },
    originalValue: {
      type: String as PropType<string>,
      default: ''
    },
    modifiedValue: {
      type: String as PropType<string>,
      default: ''
    },
    suffix: {
      type: String as PropType<string>,
      default: ''
    },
    viewMode: {
      type: String as PropType<VmoMonacoViewMode>,
      default: 'edit'
    },
    editMode: {
      type: String as PropType<VmoMonacoDiffEditMode>,
      default: 'diff'
    },
    previewSource: {
      type: String as PropType<VmoMonacoPreviewSource>,
      default: undefined
    },
    diffViewMode: {
      type: String as PropType<VmoMonacoDiffViewMode>,
      default: 'side-by-side'
    },
    editableOriginal: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    editableModified: {
      type: Boolean as PropType<boolean>,
      default: true
    },
    needConfirm: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    bidibind: {
      type: Boolean as PropType<boolean>,
      default: true
    },
    fullScreen: {
      type: Boolean,
      default: false
    },
    zIndex: {
      type: Number as PropType<number>,
      default: 99
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    originalUri: {
      type: String as PropType<string>,
      default: DEFAULT_ORIGINAL_URI
    },
    modifiedUri: {
      type: String as PropType<string>,
      default: DEFAULT_MODIFIED_URI
    },
    monacoOptions: {
      type: Object as PropType<
        Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>
      >,
      default: () => ({})
    },
    diffOptions: {
      type: Object as PropType<Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>>,
      default: () => ({})
    },
    showReviewActions: {
      type: Boolean as PropType<boolean>,
      default: true
    }
  },
  emits: [
    'update:viewMode',
    'view-mode-change',
    'update:editMode',
    'edit-mode-change',
    'update:previewSource',
    'update:diffViewMode',
    'diff-view-mode-change',
    'update:monacoOptions',
    'options-change',
    'update:diffOptions',
    'diff-options-change',
    'update:fullScreen',
    'fullscreen-change',
    'update:originalValue',
    'update:modifiedValue',
    'change',
    'accept-change',
    'reject-change',
    'accept-all',
    'reject-all',
    'confirm',
    'focuse',
    'blur',
    'preview-source-change',
  ],
  setup(props, context) {
    const componentUid = getCurrentInstance()?.uid || Math.random().toString(36).slice(2)
    // ===== 容器状态 =====
    // 这些状态控制组件外壳，与 Monaco model 内容无关。
    const { isFullScreen, changeFullScreen, fullscreenSwitch } = useEditorFullscreen(
      () => props.fullScreen, context.emit
    )
    const MonacoEditorRef = shallowRef(null as any)
    const monacoEditorInstance = shallowRef(null as VmoMonacoAnyDiffEditor | null)

    // ===== 文本模型 =====
    // originalModel 表示当前确认稿；modifiedModel 表示当前候选稿。
    // 两端审阅操作只在这两个 model 之间移动内容，不额外保存 base 版本。
    const originalModel = shallowRef(null as Monaco.editor.ITextModel | null)
    const modifiedModel = shallowRef(null as Monaco.editor.ITextModel | null)

    // ===== 视图模式 =====
    // viewMode 控制编辑/预览，editMode 独立选择确认稿/候选稿/diff。
    // diffViewMode 只影响 diff 模式下的并排/混合渲染。
    const hasPreview = ref(!!context.slots?.preview)
    const currentEditMode = ref<VmoMonacoDiffEditMode>(props.editMode)
    const currentViewMode = ref<VmoMonacoViewMode>(props.viewMode === 'preview' && hasPreview.value ? 'preview' : 'edit')
    const currentPreviewSource = ref<VmoMonacoPreviewSource>(props.previewSource || (currentEditMode.value == 'original' ? 'original' : 'modified'))
    const currentDiffViewMode = ref(props.diffViewMode)

    // ===== 审阅状态 =====
    // lineChanges 来自 Monaco diff 结果；reviewActionMaps 负责把原生 +/- 点击映射回 change index。
    const lineChanges = ref([] as Monaco.editor.ILineChange[])
    const reviewActionMaps = ref(createEmptyReviewActionMaps())
    let diffVersions: [number, number] | null = null
    const diffPending = ref(true)
    const backgroundDiffEditor = shallowRef<Monaco.editor.IStandaloneDiffEditor | null>(null)

    // ===== 内容缓存 =====
    // needConfirm=false 时 model 变化会立刻同步；needConfirm=true 时由 confirm/commit 输出。
    const originalInnerValue = ref('')
    const modifiedInnerValue = ref('')
    const previewContent = computed(() => currentPreviewSource.value == 'original' ? originalInnerValue.value : modifiedInnerValue.value)
    const previewLanguage = computed(() => computedMonacoEditorOption.value.language || 'plaintext')

    // ===== 资源释放 =====
    // Monaco editor/model 的事件都要手动 dispose，避免模式切换后重复触发。
    const editorDisposables = ref([] as Monaco.IDisposable[])
    const modelDisposables = ref([] as Monaco.IDisposable[])

    // ===== Monaco 配置 =====
    // 普通配置用于单栏 editor 和 diff editor 内部两侧 editor；diff 配置只用于 diff editor。
    const { options: monacoEditorOptions, reset: resetMonacoEditorOptions } = useEditorOptions(
      () => props.monacoOptions, context.emit, 'monacoOptions', 'options-change'
    )
    const { options: diffEditorOptions, reset: resetMonacoDiffEditorOptions } = useEditorOptions(
      () => props.diffOptions, context.emit, 'diffOptions', 'diff-options-change'
    )

    // 最终普通 editor 配置；用于 original/modified 单独显示模式，也作为 diff editor 的基础配置来源。
    const computedMonacoEditorOption = computed<Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>>(() => {
      return mergeDeepRight(
        vmoMonacoEditorDefaultOption,
        mergeDeepRight(monacoEditorOptions.value, { lightbulb: { enabled: false } })
      )
    })
    const currentReadOnly = computed(() => currentEditMode.value === 'diff'
      ? props.disabled || (!props.editableOriginal && !props.editableModified)
      : getNormalEditorReadOnly())
    const computedDiffEditorOption = computed(() => {
      return mergeDeepRight(diffEditorOptions.value, {
        lightbulb: {
          enabled: false
        },
        readOnly: props.disabled || !props.editableModified,
        originalEditable: !props.disabled && props.editableOriginal,
        renderSideBySide: currentDiffViewMode.value == 'side-by-side'
      }) as Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>
    })

    watch(() => computedMonacoEditorOption.value.language, language => {
      if (!language) return
      for (const model of [originalModel.value, modifiedModel.value]) {
        if (model && model.getLanguageId() != language) Monaco.editor.setModelLanguage(model, language)
      }
    })
    watch(
      () => computedMonacoEditorOption.value.theme,
      theme => {
        if (theme) {
          Monaco.editor.setTheme(theme)
        }
      },
      { immediate: true }
    )
    watch(
      () => [computedMonacoEditorOption.value, computedDiffEditorOption.value, props.disabled, props.editableOriginal, props.editableModified],
      () => {
        updateCurrentEditorOptions()
      },
      { deep: true }
    )
    watch(() => props.viewMode, changeViewMode)
    watch(() => props.editMode, changeEditMode)
    watch(
      () => props.diffViewMode,
      mode => {
        changeDiffViewMode(mode)
      }
    )
    watch(
      () => props.originalValue,
      value => {
        if (!isNil(value) && props.bidibind && value != originalInnerValue.value) {
          setModelValue(originalModel.value, value)
        }
      }
    )
    watch(
      () => props.modifiedValue,
      value => {
        if (!isNil(value) && props.bidibind && value != modifiedInnerValue.value) {
          setModelValue(modifiedModel.value, value)
        }
      }
    )

    watch(() => props.previewSource, source => {
      if (source) changePreviewSource(source)
    })
    onBeforeUpdate(() => {
      hasPreview.value = !!context.slots?.preview
      if (!hasPreview.value && currentViewMode.value == 'preview') changeViewMode('edit')
    })

    // 初始化时先创建两个稳定 model，再根据 viewMode 和 editMode 创建对应 editor view。
    // 后续切模式只销毁/重建 editor view，不销毁 model，避免丢失用户编辑内容。
    onMounted(() => {
      initModels()
      nextTick(() => {
        refreshMonacoEditor()
      })
    })
    onBeforeUnmount(() => {
      disposeEditor()
      disposeModels()
    })

    // 创建 original/modified 两个 model，并监听内容变化同步到内部缓存。
    function initModels() {
      originalInnerValue.value = props.originalValue
      modifiedInnerValue.value = props.modifiedValue
      originalModel.value = Monaco.editor.createModel(
        props.originalValue,
        computedMonacoEditorOption.value.language,
        createModelUri(props.originalUri, DEFAULT_ORIGINAL_URI)
      )
      modifiedModel.value = Monaco.editor.createModel(
        props.modifiedValue,
        computedMonacoEditorOption.value.language,
        createModelUri(props.modifiedUri, DEFAULT_MODIFIED_URI)
      )
      modelDisposables.value = [
        originalModel.value.onDidChangeContent(() => {
          invalidateDiff()
          originalInnerValue.value = originalModel.value?.getValue() || ''
          !props.needConfirm && context.emit('update:originalValue', originalInnerValue.value)
        }),
        modifiedModel.value.onDidChangeContent(() => {
          invalidateDiff()
          modifiedInnerValue.value = modifiedModel.value?.getValue() || ''
          !props.needConfirm && context.emit('update:modifiedValue', modifiedInnerValue.value)
        })
      ]
    }

    // 根据独立的 viewMode 和 editMode 创建普通 editor 或 diff editor。
    // 普通模式绑定单个 model；diff 模式绑定 original + modified 两个 model。
    function refreshMonacoEditor() {
      disposeEditor()
      if (!MonacoEditorRef.value || !originalModel.value || !modifiedModel.value) return

      if (currentViewMode.value == 'preview') {
        createBackgroundDiffEditor()
        return
      }

      if (currentEditMode.value == 'diff') {
        const instance = Monaco.editor.createDiffEditor(
          MonacoEditorRef.value,
          mergeDeepRight(computedMonacoEditorOption.value, computedDiffEditorOption.value)
        )
        instance.setModel({
          original: originalModel.value,
          modified: modifiedModel.value
        })
        monacoEditorInstance.value = instance
        bindNormalEditorEvents(instance.getModifiedEditor())
        bindDiffEditorEvents(instance)
        updateCurrentEditorOptions()
        refreshLineChanges()
        refreshReviewActionMaps()
        layoutCurrentEditor()
        return
      }

      const targetModel = currentEditMode.value == 'original' ? originalModel.value : modifiedModel.value
      const instance = Monaco.editor.create(
        MonacoEditorRef.value,
        mergeDeepRight(computedMonacoEditorOption.value as Monaco.editor.IStandaloneEditorConstructionOptions, {
          model: targetModel,
          readOnly: getNormalEditorReadOnly()
        })
      )
      monacoEditorInstance.value = instance
      bindNormalEditorEvents(instance)
      updateCurrentEditorOptions()
      createBackgroundDiffEditor()
      layoutCurrentEditor()
    }

    function createBackgroundDiffEditor() {
      // Models are guaranteed by refreshMonacoEditor before creating a comparison.
      // Use Monaco's own diff engine while the visible editor shows just one model.
      // The detached view never enters the page or receives user input.
      const comparison = Monaco.editor.createDiffEditor(document.createElement('div'), {
        ...mergeDeepRight(computedMonacoEditorOption.value, computedDiffEditorOption.value),
        automaticLayout: false,
        dimension: { width: 1, height: 1 },
        readOnly: true,
        originalEditable: false
      })
      backgroundDiffEditor.value = comparison
      bindDiffCalculation(comparison)
      comparison.setModel({ original: originalModel.value!, modified: modifiedModel.value! })
    }

    function createModelUri(uri: string, defaultUri: string) {
      const baseUri = uri == defaultUri ? `${uri}-${componentUid}` : uri
      let modelUri = Monaco.Uri.parse(`inmemory://${baseUri}`)
      let retryIndex = 1
      while (Monaco.editor.getModel(modelUri)) {
        modelUri = Monaco.Uri.parse(`inmemory://${baseUri}-${componentUid}-${retryIndex}`)
        retryIndex++
      }
      return modelUri
    }

    function layoutCurrentEditor() {
      nextTick(() => {
        requestAnimationFrame(() => {
          monacoEditorInstance.value?.layout()
        })
      })
    }

    // 普通 editor 与 diff 的 modified editor 共用焦点/失焦事件绑定。
    function bindNormalEditorEvents(editor: VmoMonacoNormalEditor) {
      editorDisposables.value.push(
        editor.onDidFocusEditorText(() => {
          context.emit('focuse')
        }),
        editor.onDidBlurEditorText(() => {
          context.emit('blur')
          !props.needConfirm && emitChange()
        })
      )
    }

    // diff editor 额外监听 diff 结果更新，并绑定原生 +/- 点击事件。
    function bindDiffEditorEvents(editor: VmoMonacoDiffEditor) {
      bindDiffCalculation(editor)
      editorDisposables.value.push(
        editor.getOriginalEditor().onMouseDown(event => {
          handleReviewActionMouseDown(event, 'original')
        }),
        editor.getModifiedEditor().onMouseDown(event => {
          handleReviewActionMouseDown(event, 'modified')
        })
      )
    }

    function invalidateDiff() {
      diffVersions = null
      diffPending.value = true
      lineChanges.value = []
      clearReviewActionMaps()
    }

    function bindDiffCalculation(editor: Monaco.editor.IStandaloneDiffEditor) {
      editorDisposables.value.push(editor.onDidUpdateDiff(() => {
        if (!originalModel.value || !modifiedModel.value || editor.getLineChanges() === null) return
        diffVersions = [originalModel.value.getVersionId(), modifiedModel.value.getVersionId()]
        diffPending.value = false
        refreshLineChanges()
        refreshReviewActionMaps()
      }))
    }

    // 热更新当前 editor view 的选项，避免只因为配置变化就销毁重建 editor。
    function updateCurrentEditorOptions() {
      const instance = monacoEditorInstance.value
      backgroundDiffEditor.value?.updateOptions({
        ...mergeDeepRight(computedMonacoEditorOption.value, computedDiffEditorOption.value),
        automaticLayout: false, readOnly: true, originalEditable: false
      })
      if (!instance) return
      if (isDiffEditor(instance)) {
        instance.updateOptions(mergeDeepRight(computedMonacoEditorOption.value, computedDiffEditorOption.value))
        instance.getOriginalEditor().updateOptions({
          lightbulb: {
            enabled: false
          },
          readOnly: props.disabled || !props.editableOriginal
        })
        instance.getModifiedEditor().updateOptions({
          lightbulb: {
            enabled: false
          },
          readOnly: props.disabled || !props.editableModified
        })
      } else {
        instance.updateOptions(
          mergeDeepRight(computedMonacoEditorOption.value, {
            lightbulb: {
              enabled: false
            },
            readOnly: getNormalEditorReadOnly()
          })
        )
      }
    }

    function getNormalEditorReadOnly() {
      return props.disabled || (currentEditMode.value == 'original' ? !props.editableOriginal : !props.editableModified)
    }

    function setModelValue(model: Monaco.editor.ITextModel | null, value: string) {
      if (!!model && model.getValue() != value) {
        model.setValue(value)
      }
    }

    function emitChange() {
      context.emit('change', {
        originalValue: originalInnerValue.value,
        modifiedValue: modifiedInnerValue.value
      } as VmoMonacoDiffChangePayload)
    }

    function emitModelValues() {
      context.emit('update:originalValue', originalInnerValue.value)
      context.emit('update:modifiedValue', modifiedInnerValue.value)
      emitChange()
    }

    function emitModelValuesWithoutConfirm() {
      !props.needConfirm && emitModelValues()
    }

    // 从 Monaco diff editor 读取最新差异块。
    function refreshLineChanges() {
      const editor = getDiffEditor() || backgroundDiffEditor.value
      lineChanges.value = hasCurrentDiff() ? editor?.getLineChanges() || [] : []
    }

    // 生成原生 +/- 点击到 lineChanges index 的映射。
    function refreshReviewActionMaps() {
      if (!getDiffEditor() || !props.showReviewActions) return
      reviewActionMaps.value = createReviewActionMaps(lineChanges.value, originalModel.value, modifiedModel.value)
    }

    function clearReviewActionMaps() {
      reviewActionMaps.value = createEmptyReviewActionMaps()
    }

    function handleReviewActionMouseDown(event: Monaco.editor.IEditorMouseEvent, side: VmoMonacoReviewSide) {
      if (!props.showReviewActions || !hasCurrentDiff()) return
      const action = getNativeDiffAction(event, MonacoEditorRef.value)
      if (!action) return
      const lineNumber = event.target.position?.lineNumber || event.target.range?.startLineNumber
      if (!lineNumber) return
      const index = getReviewActionIndex({
        action,
        side,
        lineNumber,
        maps: reviewActionMaps.value,
        lineChanges: lineChanges.value,
        diffEditor: getDiffEditor()
      })
      if (!isNil(index)) {
        applyLineChange(index, action)
      }
    }

    function disposeEditor() {
      invalidateDiff()
      editorDisposables.value.map(item => item.dispose())
      editorDisposables.value = []
      monacoEditorInstance.value?.dispose()
      backgroundDiffEditor.value?.dispose()
      backgroundDiffEditor.value = null
      monacoEditorInstance.value = null
    }

    function disposeModels() {
      modelDisposables.value.map(item => item.dispose())
      modelDisposables.value = []
      originalModel.value?.dispose()
      modifiedModel.value?.dispose()
      originalModel.value = null
      modifiedModel.value = null
    }

    function isDiffEditor(editor: VmoMonacoAnyDiffEditor): editor is VmoMonacoDiffEditor {
      return typeof (editor as VmoMonacoDiffEditor).getModifiedEditor == 'function'
    }

    function createEmptyReviewActionMaps(): VmoMonacoReviewActionMaps {
      return {
        originalAcceptMap: {},
        originalRejectMap: {},
        modifiedAcceptMap: {},
        modifiedRejectMap: {}
      }
    }

    function commit() {
      confirm()
    }

    function confirm() {
      emitModelValues()
      context.emit('confirm', {
        originalValue: originalInnerValue.value,
        modifiedValue: modifiedInnerValue.value,
        confirmedValue: originalInnerValue.value
      } as VmoMonacoDiffConfirmPayload)
    }

    // 全量接受：当前候选稿完整覆盖当前确认稿。
    function acceptAllChanges() {
      const nextValue = modifiedModel.value?.getValue() || ''
      setModelValue(originalModel.value, nextValue)
      nextTick(() => {
        emitModelValuesWithoutConfirm()
        refreshLineChanges()
        context.emit('accept-all', {
          originalValue: originalInnerValue.value,
          modifiedValue: modifiedInnerValue.value
        } as VmoMonacoDiffReviewActionPayload)
      })
    }

    // 全量拒绝：当前确认稿完整覆盖当前候选稿。
    function rejectAllChanges() {
      const nextValue = originalModel.value?.getValue() || ''
      setModelValue(modifiedModel.value, nextValue)
      nextTick(() => {
        emitModelValuesWithoutConfirm()
        refreshLineChanges()
        context.emit('reject-all', {
          originalValue: originalInnerValue.value,
          modifiedValue: modifiedInnerValue.value
        } as VmoMonacoDiffReviewActionPayload)
      })
    }

    function acceptChange(index: number) {
      applyLineChange(index, 'accept')
    }

    function rejectChange(index: number) {
      applyLineChange(index, 'reject')
    }

    function hasCurrentDiff() {
      return !!diffVersions && diffVersions[0] === originalModel.value?.getVersionId() &&
        diffVersions[1] === modifiedModel.value?.getVersionId()
    }

    function applyLineChange(index: number, action: VmoMonacoReviewAction) {
      if (!hasCurrentDiff()) return
      const lineChange = applyReviewLineChange(
        {
          lineChanges: lineChanges.value,
          originalModel: originalModel.value,
          modifiedModel: modifiedModel.value
        },
        index,
        action
      )
      if (!lineChange) return
      nextTick(() => {
        emitModelValuesWithoutConfirm()
        refreshLineChanges()
        context.emit(action == 'accept' ? 'accept-change' : 'reject-change', {
          index,
          lineChange,
          originalValue: originalInnerValue.value,
          modifiedValue: modifiedInnerValue.value
        } as VmoMonacoDiffReviewActionPayload)
      })
    }

    function changeLanguage(language: string) {
      !!originalModel.value && Monaco.editor.setModelLanguage(originalModel.value, language)
      !!modifiedModel.value && Monaco.editor.setModelLanguage(modifiedModel.value, language)
      resetMonacoEditorOptions({ language })
    }

    function changePreviewSource(source: VmoMonacoPreviewSource) {
      if (source != currentPreviewSource.value) {
        currentPreviewSource.value = source
        context.emit('update:previewSource', source)
        context.emit('preview-source-change', source)
      }
    }

    function changeViewMode(mode: VmoMonacoViewMode) {
      if (mode === 'preview' && !hasPreview.value) return
      if (mode === currentViewMode.value) return
      if (mode === 'preview' && props.previewSource === undefined) {
        changePreviewSource(currentEditMode.value === 'original' ? 'original' : 'modified')
      }
      currentViewMode.value = mode
      refreshMonacoEditor()
      context.emit('update:viewMode', mode)
      context.emit('view-mode-change', mode)
    }

    function changeEditMode(mode: VmoMonacoDiffEditMode) {
      if (mode === currentEditMode.value) return
      currentEditMode.value = mode
      if (currentViewMode.value === 'edit') refreshMonacoEditor()
      context.emit('update:editMode', mode)
      context.emit('edit-mode-change', mode)
    }

    function togglePreview() {
      changeViewMode(currentViewMode.value === 'preview' ? 'edit' : 'preview')
    }

    function changeDiffViewMode(mode: VmoMonacoDiffViewMode) {
      if (mode != currentDiffViewMode.value) {
        currentDiffViewMode.value = mode
        context.emit('update:diffViewMode', mode)
        context.emit('diff-view-mode-change', mode)
        if (currentViewMode.value === 'edit' && currentEditMode.value == 'diff') {
          refreshMonacoEditor()
        }
      }
    }

    function getOriginalEditor() {
      const instance = monacoEditorInstance.value
      return !!instance && isDiffEditor(instance) ? instance.getOriginalEditor() : currentEditMode.value == 'original' ? instance : null
    }

    function getModifiedEditor() {
      const instance = monacoEditorInstance.value
      return !!instance && isDiffEditor(instance) ? instance.getModifiedEditor() : currentEditMode.value == 'modified' ? instance : null
    }

    function getDiffEditor() {
      const instance = monacoEditorInstance.value
      return !!instance && isDiffEditor(instance) ? instance : null
    }

    function getLineChanges() {
      refreshLineChanges()
      return lineChanges.value
    }

    return {
      context,
      MonacoEditorRef,
      isFullScreen,
      computedMonacoEditorOption,
      monacoEditorOptions,
      mergeDeepRight,
      currentViewMode,
      currentEditMode,
      currentReadOnly,
      hasPreview,
      currentPreviewSource,
      modifiedInnerValue,
      previewContent,
      previewLanguage,
      changePreviewSource,
      currentDiffViewMode,
      lineChanges,
      diffPending,
      showReviewActions: props.showReviewActions,
      resetMonacoEditorOptions,
      resetMonacoDiffEditorOptions,
      refreshMonacoEditor,
      fullscreenSwitch,
      changeFullScreen,
      commit,
      confirm,
      acceptChange,
      rejectChange,
      acceptAllChanges,
      rejectAllChanges,
      changeLanguage,
      changeViewMode,
      changeEditMode,
      togglePreview,
      changeDiffViewMode,
      getOriginalEditor,
      getModifiedEditor,
      getDiffEditor,
      getLineChanges,
      needConfirm: props.needConfirm
    }
  }
})
</script>
