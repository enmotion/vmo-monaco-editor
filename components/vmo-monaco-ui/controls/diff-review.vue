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
        :accept-change="acceptChange"
        :reject-change="rejectChange"
        :accept-all-changes="acceptAllChanges"
        :reject-all-changes="rejectAllChanges"
        :change-display-mode="changeDisplayMode"
        :change-diff-view-mode="changeDiffViewMode"
        :confirm="confirm">
        <span class="reviewPanelRow">
          <button
            :class="['reviewPanelButton iconfont vmo-para', currentDisplayMode == 'original' ? 'is-active' : '']"
            type="button"
            title="Original"
            aria-label="Original"
            @click="changeDisplayMode('original')">
            <span class="reviewPanelIcon"></span>
          </button>
          <button
            :class="['reviewPanelButton iconfont vmo-modify', currentDisplayMode == 'modified' ? 'is-active' : '']"
            type="button"
            title="Proposal"
            aria-label="Proposal"
            @click="changeDisplayMode('modified')">
            <span class="reviewPanelIcon"></span>
          </button>
          <button
            :class="['reviewPanelButton iconfont vmo-diff', currentDisplayMode == 'diff' ? 'is-active' : '']"
            type="button"
            title="Diff"
            aria-label="Diff"
            @click="changeDisplayMode('diff')">
            <span class="reviewPanelIcon"></span>
          </button>
        </span>
        <div class="flex flex-row items-center gap-[5px]">
          <span class="reviewCount">{{ lineChanges.length }}</span>
          <button
            :class="['reviewPanelButton grow iconfont vmo-split', currentDiffViewMode == 'side-by-side' ? 'is-active' : '']"
            type="button"
            title="Side by side"
            aria-label="Side by side"
            @click="changeDiffViewMode('side-by-side')">
            <span class="reviewPanelIcon"></span>
          </button>
          <button
            :class="['reviewPanelButton iconfont vmo-mix', currentDiffViewMode == 'inline' ? 'is-active' : '']"
            type="button"
            title="Inline"
            aria-label="Inline"
            @click="changeDiffViewMode('inline')">
            <span class="reviewPanelIcon"></span>
          </button>
        </div>
        <span class="flex flex-row items-center gap-[5px]">
          <button class="reviewPanelButton grow is-accept" type="button" title="Accept all" aria-label="Accept all" @click="acceptAllChanges">
            <span class="reviewPanelIcon !text-xs font-normal iconfont vmo-plus"></span>
          </button>
          <button class="reviewPanelButton grow is-reject" type="button" title="Reject all" aria-label="Reject all" @click="rejectAllChanges">
            <span class="reviewPanelIcon !text-xs font-normal iconfont vmo-sub"></span>
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
  @apply absolute right-0 top-[26px] z-20 flex flex-col gap-[8px] p-[8px] rounded border border-[#88888833] bg-white text-gray-800 shadow-lg;
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
  @apply min-w-[26px] h-[26px] shrink-0 rounded bg-[#88888810] text-[#888888] flex flex-row items-center justify-center px-[6px];
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
  emits: ['accept-all', 'reject-all', 'confirm', 'accept-change', 'reject-change', 'display-mode-change', 'diff-view-mode-change'],
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
    const currentDisplayMode = computed(() => {
      return primaryDiffMonaco.value?.currentDisplayMode || 'diff'
    })
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

    function changeDisplayMode(mode: VmoMonacoDiffEditorExpose['currentDisplayMode']) {
      diffMonacos.value.forEach(monaco => monaco.changeDisplayMode(mode))
      context.emit('display-mode-change', createPayload('display-mode-change', undefined, { mode }))
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
      currentDisplayMode,
      currentDiffViewMode,
      togglePanel,
      acceptChange,
      rejectChange,
      acceptAllChanges,
      rejectAllChanges,
      changeDisplayMode,
      changeDiffViewMode,
      confirm
    }
  }
})
</script>
