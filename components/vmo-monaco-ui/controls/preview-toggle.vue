<template>
  <button
    v-if="previewMonacos.length"
    type="button"
    :class="['vmo-preview-toggle', { 'is-active': currentValue }]"
    title="Preview"
    aria-label="Preview"
    :aria-pressed="currentValue"
    @click="togglePreview">
    <slot :active="currentValue">P</slot>
  </button>
</template>

<style>
.vmo-preview-toggle {
  @apply h-[20px] shrink-0 rounded flex flex-row items-center justify-center cursor-pointer mr-[10px] last:mr-0 px-[6px] text-xs;
}
.vmo-preview-toggle.is-active {
  @apply text-[#00BB55] bg-[#00BB5514];
}
</style>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { VmoMonacoDiffEditorExpose } from '@type'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

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
    const currentValue = computed(() => typeof props.value == 'boolean'
      ? props.value : previewMonacos.value[0]?.currentDisplayMode == 'preview')

    function togglePreview() {
      if (!previewMonacos.value.length) return
      const nextValue = !currentValue.value
      previewMonacos.value.forEach(editor => {
        if (nextValue && editor.currentDisplayMode != 'preview') editor.changeDisplayMode('preview')
        if (!nextValue && editor.currentDisplayMode == 'preview') editor.togglePreview()
      })
      context.emit('update:value', nextValue)
      context.emit('toggle', nextValue)
      context.emit('commit', { type: 'preview', value: nextValue, config: props.config, monacoCount: previewMonacos.value.length })
    }
    return { previewMonacos, currentValue, togglePreview }
  }
})
</script>
