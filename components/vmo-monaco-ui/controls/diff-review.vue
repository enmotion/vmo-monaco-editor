<template>
  <span ref="ReviewActionsRef" class="reviewActions">
    <span
      :class="['iconButton reviewTrigger', isOpen ? '' : '']"
      type="button"
      title="Review"
      aria-label="Review"
      @click="togglePanel">
      <span class="reviewTriggerIcon iconfont vmo-compare"></span>
    </span>
    <div v-if="isOpen" class="relative">
    <span v-if="isOpen" class="reviewPanel">
      <slot
        :line-changes="lineChanges"
        :diff-pending="diffPending"
        :current-edit-mode="currentEditMode"
        :current-view-mode="currentViewMode"
        :has-preview="hasPreview"
        :accept-change="acceptChange"
        :reject-change="rejectChange"
        :accept-all-changes="acceptAllChanges"
        :reject-all-changes="rejectAllChanges"
        :change-edit-mode="changeEditMode"
        :change-diff-view-mode="changeDiffViewMode"
        :confirm="confirm">
        <span class="reviewPanelRow">
          <button
            :class="['reviewPanelButton iconfont vmo-para', currentEditMode == 'original' ? 'is-active' : '']"
            type="button"
            title="Original"
            aria-label="Original"
            @click="changeEditMode('original')">
            <span class="reviewPanelIcon"></span>
          </button>
          <button
            :class="['reviewPanelButton iconfont vmo-modify', currentEditMode == 'modified' ? 'is-active' : '']"
            type="button"
            title="Proposal"
            aria-label="Proposal"
            @click="changeEditMode('modified')">
            <span class="reviewPanelIcon"></span>
          </button>
          <button
            :class="['reviewPanelButton iconfont vmo-diff', currentEditMode == 'diff' ? 'is-active' : '']"
            type="button"
            title="Diff"
            aria-label="Diff"
            @click="changeEditMode('diff')">
            <span class="reviewPanelIcon"></span>
          </button>
        </span>
        <div v-if="currentViewMode == 'edit'" class="flex flex-row items-center gap-[5px]">
           <span
            v-if="currentEditMode == 'original' || currentEditMode == 'modified'"
            class="reviewCount"
            :title="diffPending ? 'Calculating differences' : `${lineChanges.length} diff blocks`"
            :aria-label="diffPending ? 'Calculating differences' : `${lineChanges.length} diff blocks`"
            role="status">
              <span>Changes:</span>
              <span>{{ diffPending ? '…' : lineChanges.length }}</span>
          </span>
          <button
            v-if="currentEditMode == 'diff'"
            :class="['reviewPanelButton grow iconfont vmo-split', currentDiffViewMode == 'side-by-side' ? 'is-active' : '']"
            type="button"
            title="Side by side"
            aria-label="Side by side"
            @click="changeDiffViewMode('side-by-side')">
            <span class="reviewPanelIcon"></span>
          </button>
          <button
            v-if="currentEditMode == 'diff'"
            :class="['reviewPanelButton iconfont vmo-mix', currentDiffViewMode == 'inline' ? 'is-active' : '']"
            type="button"
            title="Inline"
            aria-label="Inline"
            @click="changeDiffViewMode('inline')">
            <span class="reviewPanelIcon"></span>
          </button>
        </div>
        <span v-if="currentViewMode == 'edit' && currentEditMode == 'diff'" class="flex flex-row items-center gap-[5px]">
          <button class="reviewPanelButton grow is-reject" type="button" title="Reject all" aria-label="Reject all" :disabled="!canReview" @click="rejectAllChanges">
            <span class="reviewPanelIcon !text-xs font-normal iconfont vmo-sub"></span>
          </button>
          <button class="reviewPanelButton grow is-accept" type="button" title="Accept all" aria-label="Accept all" :disabled="!canReview" @click="acceptAllChanges">
            <span class="reviewPanelIcon !text-xs font-normal iconfont vmo-plus"></span>
          </button>
        </span>
      </slot>
    </span>
    </div>
  </span>
</template>

<style lang="css">
.reviewActions {
  @apply relative flex flex-row items-center w-[20px] h-[20px] mr-[10px] last:mr-0;
}
.reviewTrigger {
  @apply mr-0;
}
.reviewTriggerIcon,
.reviewPanelIcon {
  @apply block leading-none font-bold;
}
.reviewPanel {
  @apply absolute right-[12px] top-[12px] z-20 flex flex-col gap-[8px] p-[8px] rounded border border-[#88888833] bg-white text-gray-800 shadow-lg;
}
.dark .reviewPanel {
  @apply absolute bg-[#1C1C1C] text-[#FFFFFFCC];
}
.reviewPanelRow {
  @apply flex flex-row items-center gap-[6px];
}
.reviewPanelButton {
  @apply w-[24px] h-[24px] !text-base shrink-0 rounded border border-[#88888844] bg-[#88888810] cursor-pointer flex flex-row items-center justify-center hover:bg-[#88888820];
}
.reviewPanelButton:disabled {
  @apply opacity-40 cursor-default;
}
.reviewPanelButton.is-active {
  @apply border-[#00BB5588] text-[#00BB55] bg-[#00BB5514];
}
.reviewPanelButton.is-accept {
  @apply text-[#00BB55];
}
.reviewPanelButton.is-reject {
  @apply text-[#DD3333];
}
.reviewCount {
  @apply shrink-0 flex-grow rounded bg-[#88888810] text-[#888888] flex flex-row items-center justify-between px-[6px];
}
</style>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref } from 'vue'
import type * as Monaco from 'monaco-editor'
import type { VmoMonacoDiffEditorExpose } from '@type'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

export type VmoMonacoDiffReviewControlValue = unknown
export type VmoMonacoDiffReviewControlConfig = boolean

export default defineComponent({
  name: 'vmo-monaco-review-actions',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoDiffReviewControlValue, VmoMonacoDiffReviewControlConfig>()
  },
  emits: ['accept-all', 'reject-all', 'confirm', 'accept-change', 'reject-change', 'edit-mode-change', 'diff-view-mode-change'],
  setup(props, context) {
    const { monacos } = useVmoMonacoControl(props)
    const ReviewActionsRef = ref(null as HTMLElement | null)
    const isOpen = ref(false)

    const diffMonacos = computed(() => {
      return monacos.value.filter(isDiffMonaco)
    })
    const primaryDiffMonaco = computed(() => diffMonacos.value[0] || null)
    const lineChanges = computed(() => {
      return primaryDiffMonaco.value?.lineChanges || primaryDiffMonaco.value?.getLineChanges() || []
    })
    const diffPending = computed(() => primaryDiffMonaco.value?.diffPending ?? false)
    const canReview = computed(() => !diffPending.value && lineChanges.value.length > 0)
    const currentEditMode = computed(() => {
      return primaryDiffMonaco.value?.currentEditMode || 'diff'
    })
    const currentViewMode = computed(() => primaryDiffMonaco.value?.currentViewMode || 'edit')
    const hasPreview = computed(() => primaryDiffMonaco.value?.hasPreview ?? false)
    const currentDiffViewMode = computed(() => {
      return primaryDiffMonaco.value?.currentDiffViewMode || 'side-by-side'
    })

    function isDiffMonaco(monaco: unknown): monaco is VmoMonacoDiffEditorExpose {
      const target = monaco as Partial<VmoMonacoDiffEditorExpose>
      return typeof target?.acceptAllChanges == 'function' && typeof target?.getLineChanges == 'function'
    }

    function togglePanel() {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        document.addEventListener('mousedown', handleDocumentMouseDown)
      } else {
        document.removeEventListener('mousedown', handleDocumentMouseDown)
      }
    }

    function closePanel() {
      isOpen.value = false
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }

    function handleDocumentMouseDown(event: MouseEvent) {
      if (!ReviewActionsRef.value?.contains(event.target as Node)) {
        closePanel()
      }
    }

    function changeEditMode(mode: VmoMonacoDiffEditorExpose['currentEditMode']) {
      diffMonacos.value.forEach(monaco => monaco.changeEditMode(mode))
      context.emit('edit-mode-change', createPayload('edit-mode-change', undefined, { mode }))
    }

    function changeDiffViewMode(mode: VmoMonacoDiffEditorExpose['currentDiffViewMode']) {
      diffMonacos.value.forEach(monaco => monaco.changeDiffViewMode(mode))
      context.emit('diff-view-mode-change', createPayload('diff-view-mode-change', undefined, { mode }))
    }

    function acceptAllChanges() {
      diffMonacos.value.forEach(monaco => monaco.acceptAllChanges())
      context.emit('accept-all', createPayload('accept-all'))
    }

    function rejectAllChanges() {
      diffMonacos.value.forEach(monaco => monaco.rejectAllChanges())
      context.emit('reject-all', createPayload('reject-all'))
    }

    function confirm() {
      diffMonacos.value.forEach(monaco => monaco.confirm())
      context.emit('confirm', createPayload('confirm'))
    }

    function acceptChange(index: number) {
      diffMonacos.value.forEach(monaco => monaco.acceptChange(index))
      context.emit('accept-change', createPayload('accept-change', index))
    }

    function rejectChange(index: number) {
      diffMonacos.value.forEach(monaco => monaco.rejectChange(index))
      context.emit('reject-change', createPayload('reject-change', index))
    }

    function createPayload(type: string, index?: number, extra: Record<string, unknown> = {}) {
      return {
        type,
        value: props.value,
        config: props.config,
        monacoCount: diffMonacos.value.length,
        index,
        lineChanges: lineChanges.value as Monaco.editor.ILineChange[],
        ...extra
      }
    }

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    })

    return {
      ReviewActionsRef,
      isOpen,
      lineChanges,
      diffPending,
      canReview,
      currentEditMode,
      currentViewMode,
      hasPreview,
      currentDiffViewMode,
      togglePanel,
      acceptChange,
      rejectChange,
      acceptAllChanges,
      rejectAllChanges,
      changeEditMode,
      changeDiffViewMode,
      confirm
    }
  }
})
</script>
