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
      <slot v-if="context.slots.default"></slot>
      <slot v-if="!!prefix || context.slots.prefix" name="prefix" :option="computedMonacoEditorOption">
        <div :class="['prefix']">
          <span v-html="prefix" class="extra-code"></span>
        </div>
      </slot>
      <slot
        v-if="showReviewActions && currentDisplayMode == 'diff'"
        name="review-actions"
        :line-changes="lineChanges"
        :accept-change="acceptChange"
        :reject-change="rejectChange"
        :accept-all-changes="acceptAllChanges"
        :reject-all-changes="rejectAllChanges"
        :confirm="confirm">
        <div class="diff-review-actions">
          <button class="diff-review-action" type="button" @click="acceptAllChanges">全部接受</button>
          <button class="diff-review-action" type="button" @click="rejectAllChanges">全部拒绝</button>
          <button class="diff-review-action is-primary" type="button" @click="confirm">确认</button>
          <span class="diff-review-count">变更 {{ lineChanges.length }} 处</span>
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
.vmo-monaco-editor-container .diff-review-actions {
  @apply flex flex-row items-center gap-[6px] px-[10px] py-[6px] border-b border-[#88888830] text-xs overflow-x-auto;
}
.vmo-monaco-editor-container .diff-review-action {
  @apply shrink-0 px-[8px] py-[3px] rounded border border-[#88888844] bg-[#88888810] cursor-pointer hover:bg-[#88888820];
}
.vmo-monaco-editor-container .diff-review-action.is-primary {
  @apply border-[#00BB5588] text-[#00BB55];
}
.vmo-monaco-editor-container .diff-review-count {
  @apply shrink-0 text-[#888888];
}
.vmo-monaco-editor-container .codicon.codicon-light-bulb.lightbulb-glyph {
  @apply hidden pointer-events-none;
}
</style>

<script lang="ts">
import { defineComponent, ref, shallowRef, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { mergeDeepRight, equals, clone, isNil } from 'ramda'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import type { PropType } from 'vue'
import * as Monaco from 'monaco-editor'
import { vmoMonacoEditorDefaultOption } from '../vmo-monaco-editor/config'

export type VmoMonacoDiffDisplayMode = 'original' | 'modified' | 'diff'
export type VmoMonacoDiffViewMode = 'side-by-side' | 'inline'
export type VmoMonacoDiffChangePayload = {
  originalValue: string
  modifiedValue: string
}
export type VmoMonacoDiffConfirmPayload = VmoMonacoDiffChangePayload & {
  confirmedValue: string
}
export type VmoMonacoDiffReviewActionPayload = VmoMonacoDiffChangePayload & {
  index?: number
  lineChange?: Monaco.editor.ILineChange
}

type NormalEditor = Monaco.editor.IStandaloneCodeEditor
type DiffEditor = Monaco.editor.IStandaloneDiffEditor
type AnyEditor = NormalEditor | DiffEditor

export default defineComponent({
  name: 'vmo-monaco-diff-editor',
  inheritAttrs: false,
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
    displayMode: {
      type: String as PropType<VmoMonacoDiffDisplayMode>,
      default: 'diff'
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
      default: 'vmo-monaco-diff-original'
    },
    modifiedUri: {
      type: String as PropType<string>,
      default: 'vmo-monaco-diff-modified'
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
    'mode-change'
  ],
  setup(props, context) {
    const isFullScreen = ref(false as any)
    const MonacoEditorRef = shallowRef(null as any)
    const monacoEditorInstance = shallowRef(null as AnyEditor | null)
    const originalModel = shallowRef(null as Monaco.editor.ITextModel | null)
    const modifiedModel = shallowRef(null as Monaco.editor.ITextModel | null)
    const currentDisplayMode = ref(props.displayMode)
    const currentDiffViewMode = ref(props.diffViewMode)
    const lineChanges = ref([] as Monaco.editor.ILineChange[])
    const originalAcceptLineMap = ref({} as Record<number, number>)
    const originalRejectLineMap = ref({} as Record<number, number>)
    const modifiedAcceptLineMap = ref({} as Record<number, number>)
    const modifiedRejectLineMap = ref({} as Record<number, number>)
    const originalInnerValue = ref('')
    const modifiedInnerValue = ref('')
    const editorDisposables = ref([] as Monaco.IDisposable[])
    const modelDisposables = ref([] as Monaco.IDisposable[])
    const monacoEditorOptions = ref(
      {} as Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>
    )
    const diffEditorOptions = ref({} as Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>)

    // 最终普通 editor 配置；用于 original/modified 单独显示模式，也作为 diff editor 的基础配置来源。
    const computedMonacoEditorOption = computed(() => {
      monacoEditorOptions.value
      return JSON.parse(
        JSON.stringify(
          mergeDeepRight(
            vmoMonacoEditorDefaultOption,
            mergeDeepRight(monacoEditorOptions.value, {
              lightbulb: {
                enabled: false
              }
            })
          )
        )
      )
    })
    const computedDiffEditorOption = computed(() => {
      diffEditorOptions.value
      return mergeDeepRight(diffEditorOptions.value, {
        lightbulb: {
          enabled: false
        },
        readOnly: props.disabled || !props.editableModified,
        originalEditable: !props.disabled && props.editableOriginal,
        renderSideBySide: currentDiffViewMode.value == 'side-by-side'
      }) as Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>
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
      () => props.diffOptions,
      (n, o) => {
        if (!!n && !equals(n, o)) {
          diffEditorOptions.value = clone(n)
        }
      },
      { immediate: true, deep: true }
    )
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
    watch(
      () => props.displayMode,
      mode => {
        if (mode != currentDisplayMode.value) {
          currentDisplayMode.value = mode
          refreshMonacoEditor()
          context.emit('mode-change', mode)
        }
      }
    )
    watch(
      () => props.diffViewMode,
      mode => {
        if (mode != currentDiffViewMode.value) {
          currentDiffViewMode.value = mode
        }
        if (currentDisplayMode.value == 'diff') {
          refreshMonacoEditor()
        }
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

    function initModels() {
      originalInnerValue.value = props.originalValue
      modifiedInnerValue.value = props.modifiedValue
      originalModel.value = Monaco.editor.createModel(
        props.originalValue,
        computedMonacoEditorOption.value.language,
        Monaco.Uri.parse(`inmemory://${props.originalUri}`)
      )
      modifiedModel.value = Monaco.editor.createModel(
        props.modifiedValue,
        computedMonacoEditorOption.value.language,
        Monaco.Uri.parse(`inmemory://${props.modifiedUri}`)
      )
      modelDisposables.value = [
        originalModel.value.onDidChangeContent(() => {
          originalInnerValue.value = originalModel.value?.getValue() || ''
          !props.needConfirm && context.emit('update:originalValue', originalInnerValue.value)
        }),
        modifiedModel.value.onDidChangeContent(() => {
          modifiedInnerValue.value = modifiedModel.value?.getValue() || ''
          !props.needConfirm && context.emit('update:modifiedValue', modifiedInnerValue.value)
        })
      ]
    }

    function refreshMonacoEditor() {
      disposeEditor()
      if (!MonacoEditorRef.value || !originalModel.value || !modifiedModel.value) return

      if (currentDisplayMode.value == 'diff') {
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
        return
      }

      const targetModel = currentDisplayMode.value == 'original' ? originalModel.value : modifiedModel.value
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
      lineChanges.value = []
    }

    function bindNormalEditorEvents(editor: NormalEditor) {
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

    function bindDiffEditorEvents(editor: DiffEditor) {
      editorDisposables.value.push(
        editor.onDidUpdateDiff(() => {
          refreshLineChanges()
          refreshReviewActionMaps()
        }),
        editor.getOriginalEditor().onMouseDown(event => {
          handleReviewActionMouseDown(event, 'original')
        }),
        editor.getModifiedEditor().onMouseDown(event => {
          handleReviewActionMouseDown(event, 'modified')
        })
      )
    }

    function updateCurrentEditorOptions() {
      const instance = monacoEditorInstance.value
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
      return props.disabled || (currentDisplayMode.value == 'original' ? !props.editableOriginal : !props.editableModified)
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

    function refreshLineChanges() {
      const editor = getDiffEditor()
      lineChanges.value = editor?.getLineChanges() || []
    }

    function refreshReviewActionMaps() {
      const editor = getDiffEditor()
      if (!editor || !props.showReviewActions) return
      const originalAcceptMap = {} as Record<number, number>
      const originalRejectMap = {} as Record<number, number>
      const modifiedAcceptMap = {} as Record<number, number>
      const modifiedRejectMap = {} as Record<number, number>

      lineChanges.value.forEach((lineChange, index) => {
        const originalLineNumber = getReviewActionLineNumber(originalModel.value, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber)
        const modifiedLineNumber = getReviewActionLineNumber(modifiedModel.value, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber)

        if (modifiedLineNumber) {
          modifiedAcceptMap[modifiedLineNumber] = index
        } else if (originalLineNumber) {
          originalAcceptMap[originalLineNumber] = index
        }

        if (originalLineNumber) {
          originalRejectMap[originalLineNumber] = index
          // Inline diff can render both deleted and inserted lines inside the modified editor.
          // Keep a mirrored mapping so clicks on Monaco's native '-' marker still resolve.
          modifiedRejectMap[originalLineNumber] = index
        } else if (modifiedLineNumber) {
          modifiedRejectMap[modifiedLineNumber] = index
        }
      })

      originalAcceptLineMap.value = originalAcceptMap
      originalRejectLineMap.value = originalRejectMap
      modifiedAcceptLineMap.value = modifiedAcceptMap
      modifiedRejectLineMap.value = modifiedRejectMap
    }

    function clearReviewActionMaps() {
      originalAcceptLineMap.value = {}
      originalRejectLineMap.value = {}
      modifiedAcceptLineMap.value = {}
      modifiedRejectLineMap.value = {}
    }

    function getReviewActionLineNumber(model: Monaco.editor.ITextModel | null, startLineNumber: number, endLineNumber: number) {
      if (!model) return 0
      const lineCount = model.getLineCount()
      if (startLineNumber > 0) return Math.min(startLineNumber, lineCount)
      if (endLineNumber > 0) return Math.min(endLineNumber, lineCount)
      return 0
    }

    function handleReviewActionMouseDown(event: Monaco.editor.IEditorMouseEvent, side: 'original' | 'modified') {
      const action = getNativeDiffAction(event, side)
      if (!action) return
      const lineNumber = event.target.position?.lineNumber || event.target.range?.startLineNumber
      if (!lineNumber) return
      const acceptIndex =
        side == 'original'
          ? originalAcceptLineMap.value[lineNumber]
          : modifiedAcceptLineMap.value[lineNumber] ?? findNearestLineChangeIndex(lineNumber, 'modified')
      const rejectIndex =
        side == 'original'
          ? originalRejectLineMap.value[lineNumber] ?? findNearestLineChangeIndex(lineNumber, 'original')
          : modifiedRejectLineMap.value[lineNumber] ?? findNearestLineChangeIndex(lineNumber, 'modified')
      if (action == 'accept' && !isNil(acceptIndex)) {
        acceptChange(acceptIndex)
        return
      }
      if (action == 'reject' && !isNil(rejectIndex)) {
        rejectChange(rejectIndex)
      }
    }

    function getNativeDiffAction(event: Monaco.editor.IEditorMouseEvent, side: 'original' | 'modified') {
      const target = event.event.browserEvent.target as HTMLElement | null
      const actionNode = findNativeDiffActionNode(target)
      const text = actionNode?.textContent?.trim()
      const className = actionNode?.className?.toString() || ''
      if (text == '+') return 'accept'
      if (text == '-') return 'reject'
      if (className.includes('insert') || className.includes('add')) return 'accept'
      if (className.includes('delete') || className.includes('remove')) return 'reject'
      return null
    }

    function findNativeDiffActionNode(target: HTMLElement | null) {
      let node = target
      while (node && node != MonacoEditorRef.value) {
        const text = node.textContent?.trim()
        const className = node.className?.toString() || ''
        if (
          text == '+' ||
          text == '-' ||
          className.includes('line-insert') ||
          className.includes('line-delete') ||
          className.includes('char-insert') ||
          className.includes('char-delete') ||
          className.includes('insert-sign') ||
          className.includes('delete-sign') ||
          className.includes('remove')
        ) {
          return node
        }
        node = node.parentElement
      }
      return null
    }

    function findNearestLineChangeIndex(lineNumber: number, side: 'original' | 'modified') {
      const index = lineChanges.value.findIndex(lineChange => {
        const startLineNumber = side == 'original' ? lineChange.originalStartLineNumber : lineChange.modifiedStartLineNumber
        const endLineNumber = side == 'original' ? lineChange.originalEndLineNumber : lineChange.modifiedEndLineNumber
        if (startLineNumber == 0 || endLineNumber == 0) return false
        return lineNumber >= startLineNumber && lineNumber <= endLineNumber
      })
      return index >= 0 ? index : undefined
    }

    function disposeEditor() {
      clearReviewActionMaps()
      editorDisposables.value.map(item => item.dispose())
      editorDisposables.value = []
      monacoEditorInstance.value?.dispose()
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

    function isDiffEditor(editor: AnyEditor): editor is DiffEditor {
      return typeof (editor as DiffEditor).getModifiedEditor == 'function'
    }

    function resetMonacoEditorOptions(options: Partial<Monaco.editor.IStandaloneEditorConstructionOptions>) {
      monacoEditorOptions.value = mergeDeepRight(monacoEditorOptions.value, options) as Partial<
        Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }
      >
    }

    function resetMonacoDiffEditorOptions(options: Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>) {
      diffEditorOptions.value = mergeDeepRight(diffEditorOptions.value, options)
    }

    function fullscreenSwitch() {
      isFullScreen.value = !isFullScreen.value
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

    function acceptAllChanges() {
      const nextValue = modifiedModel.value?.getValue() || ''
      setModelValue(originalModel.value, nextValue)
      nextTick(() => {
        emitModelValues()
        refreshLineChanges()
        context.emit('accept-all', {
          originalValue: originalInnerValue.value,
          modifiedValue: modifiedInnerValue.value
        } as VmoMonacoDiffReviewActionPayload)
      })
    }

    function rejectAllChanges() {
      const nextValue = originalModel.value?.getValue() || ''
      setModelValue(modifiedModel.value, nextValue)
      nextTick(() => {
        emitModelValues()
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

    function applyLineChange(index: number, action: 'accept' | 'reject') {
      const lineChange = lineChanges.value[index]
      if (!lineChange || !originalModel.value || !modifiedModel.value) return
      const sourceModel = action == 'accept' ? modifiedModel.value : originalModel.value
      const targetModel = action == 'accept' ? originalModel.value : modifiedModel.value
      const sourceRange = action == 'accept'
        ? getLineChangeRange(sourceModel, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber)
        : getLineChangeRange(sourceModel, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber)
      const targetRange = action == 'accept'
        ? getLineChangeRange(targetModel, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber)
        : getLineChangeRange(targetModel, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber)
      targetModel.pushEditOperations([], [
        {
          range: targetRange,
          text: sourceModel.getValueInRange(sourceRange)
        }
      ], () => null)
      nextTick(() => {
        emitModelValues()
        refreshLineChanges()
        context.emit(action == 'accept' ? 'accept-change' : 'reject-change', {
          index,
          lineChange,
          originalValue: originalInnerValue.value,
          modifiedValue: modifiedInnerValue.value
        } as VmoMonacoDiffReviewActionPayload)
      })
    }

    function getLineChangeRange(model: Monaco.editor.ITextModel, startLineNumber: number, endLineNumber: number) {
      const lineCount = model.getLineCount()
      if (startLineNumber == 0 || endLineNumber == 0) {
        const targetLine = Math.min(Math.max(startLineNumber || endLineNumber || 1, 1), lineCount)
        return new Monaco.Range(targetLine, 1, targetLine, 1)
      }
      const safeStartLineNumber = Math.min(Math.max(startLineNumber, 1), lineCount)
      const safeEndLineNumber = Math.min(Math.max(endLineNumber, safeStartLineNumber), lineCount)
      return new Monaco.Range(
        safeStartLineNumber,
        1,
        safeEndLineNumber,
        model.getLineMaxColumn(safeEndLineNumber)
      )
    }

    function changeLanguage(language: string) {
      !!originalModel.value && Monaco.editor.setModelLanguage(originalModel.value, language)
      !!modifiedModel.value && Monaco.editor.setModelLanguage(modifiedModel.value, language)
      resetMonacoEditorOptions({ language })
    }

    function changeDisplayMode(mode: VmoMonacoDiffDisplayMode) {
      if (mode != currentDisplayMode.value) {
        currentDisplayMode.value = mode
        refreshMonacoEditor()
        context.emit('mode-change', mode)
      }
    }

    function changeDiffViewMode(mode: VmoMonacoDiffViewMode) {
      if (mode != currentDiffViewMode.value) {
        currentDiffViewMode.value = mode
        if (currentDisplayMode.value == 'diff') {
          refreshMonacoEditor()
        }
      }
    }

    function getOriginalEditor() {
      const instance = monacoEditorInstance.value
      return !!instance && isDiffEditor(instance) ? instance.getOriginalEditor() : currentDisplayMode.value == 'original' ? instance : null
    }

    function getModifiedEditor() {
      const instance = monacoEditorInstance.value
      return !!instance && isDiffEditor(instance) ? instance.getModifiedEditor() : currentDisplayMode.value == 'modified' ? instance : null
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
      currentDisplayMode,
      currentDiffViewMode,
      lineChanges,
      showReviewActions: props.showReviewActions,
      resetMonacoEditorOptions,
      resetMonacoDiffEditorOptions,
      refreshMonacoEditor,
      fullscreenSwitch,
      commit,
      confirm,
      acceptChange,
      rejectChange,
      acceptAllChanges,
      rejectAllChanges,
      changeLanguage,
      changeDisplayMode,
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
