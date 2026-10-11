<template>
  <button
    v-if="previewMonacos.length"
    type="button"
    :class="['vmo-preview-toggle iconfont',currentValue?'is-active vmo-modify':'vmo-preview']"
    :title="currentValue ? '返回编辑器' : '预览当前内容'"
    :aria-label="currentValue ? '返回编辑器' : '预览当前内容'"
    :aria-pressed="currentValue"
    @click="togglePreview">
    <slot :active="currentValue"><span class="preview-toggle-label">{{ currentValue ? '返回编辑器' : '预览' }}</span></slot>
  </button>
</template>

<style>
.vmo-preview-toggle {
  @apply h-[20px] shrink-0 rounded flex flex-row items-center justify-center cursor-pointer mr-[10px] last:mr-0 px-[6px] text-xs;
}
.vmo-preview-toggle.is-active {
  @apply text-[#00BB55] bg-[#00BB5514];
}
.preview-toggle-label { margin-left: 5px; font-family: sans-serif; }
</style>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { VmoMonacoDiffEditorExpose } from '@type'
import { createVmoMonacoControlProps, useVmoMonacoControl, useVmoMonacoControlValue } from './use-monaco-control'

export type VmoMonacoPreviewControlValue = boolean
export type VmoMonacoPreviewControlConfig = boolean

export default defineComponent({
  name: 'vmo-monaco-preview-toggle',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoPreviewControlValue, VmoMonacoPreviewControlConfig>()
  },
  emits: ['update:value', 'toggle', 'commit'],
  setup(props, context) {
    const { monacos } = useVmoMonacoControl(props)
    const previewMonacos = computed(() => monacos.value.filter((target): target is VmoMonacoDiffEditorExpose => {
      const editor = target as Partial<VmoMonacoDiffEditorExpose>
      return !!editor.hasPreview && typeof editor.togglePreview == 'function'
    }))
    function applyPreview(value: boolean) {
      previewMonacos.value.forEach(editor => {
        if (value && editor.currentDisplayMode != 'preview') editor.changeDisplayMode('preview')
        if (!value && editor.currentDisplayMode == 'preview') editor.togglePreview()
      })
    }
    const currentValue = useVmoMonacoControlValue(
      () => props.value,
      () => previewMonacos.value[0]?.currentDisplayMode == 'preview',
      applyPreview
    )

    function togglePreview() {
      if (!previewMonacos.value.length) return
      const nextValue = !currentValue.value
      currentValue.value = nextValue
      applyPreview(nextValue)
      context.emit('update:value', nextValue)
      context.emit('toggle', nextValue)
      context.emit('commit', { type: 'preview', value: nextValue, config: props.config, monacoCount: previewMonacos.value.length })
    }
    return { previewMonacos, currentValue, togglePreview }
  }
})
</script>
