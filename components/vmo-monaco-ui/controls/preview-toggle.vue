<template>
  <button
    v-if="previewMonacos.length"
    type="button"
    :class="['vmo-preview-toggle iconfont',currentValue?'is-active vmo-modify':'vmo-preview']"
    :title="currentValue ? '返回编辑器' : '预览当前内容'"
    :aria-label="currentValue ? '返回编辑器' : '预览当前内容'"
    :aria-pressed="currentValue"
    @click="togglePreview">
    <slot :active="currentValue"></slot>
  </button>
  <div v-if="sourceEditor" class="vmo-preview-source" role="group" aria-label="Preview source">
    <button type="button" :aria-pressed="sourceEditor.currentPreviewSource === 'original'" @click="changePreviewSource('original')">original</button>
    <button type="button" :aria-pressed="sourceEditor.currentPreviewSource === 'modified'" @click="changePreviewSource('modified')">modified</button>
  </div>
</template>

<style>
.vmo-preview-toggle {
  @apply h-[20px] shrink-0 rounded flex flex-row items-center justify-center cursor-pointer mr-[10px] last:mr-0 px-[6px] text-xs;
}
.vmo-preview-toggle.is-active {
  @apply text-[#00BB55] bg-[#00BB5514];
}
.vmo-preview-source {
  @apply flex flex-row items-center gap-[6px] mr-[10px] last:mr-0;
}
.vmo-preview-source button {
  @apply px-[6px] rounded text-xs border border-[#88888844];
}
.vmo-preview-source button[aria-pressed='true'] {
  @apply text-[#00BB55] border-[#00BB5588];
}
</style>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { VmoMonacoEditorExpose, VmoMonacoDiffEditorExpose } from '@type'
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
    const previewMonacos = computed(() => monacos.value.filter((target): target is VmoMonacoEditorExpose => {
      const editor = target as Partial<VmoMonacoEditorExpose>
      return !!editor.hasPreview && typeof editor.changeViewMode == 'function'
    }))
    const diffMonacos = computed(() => previewMonacos.value.filter((editor): editor is VmoMonacoDiffEditorExpose =>
      typeof (editor as Partial<VmoMonacoDiffEditorExpose>).changePreviewSource === 'function'
    ))
    const sourceEditor = computed(() => {
      const editor = diffMonacos.value[0]
      return editor?.currentViewMode === 'preview' && editor.hasContentChanges && editor.hasModifiedContent ? editor : undefined
    })
    function changePreviewSource(source: 'original' | 'modified') {
      diffMonacos.value.forEach(editor => {
        if (editor.currentViewMode === 'preview') editor.changePreviewSource(source)
      })
    }
    function applyPreview(value: boolean) {
      previewMonacos.value.forEach(editor => editor.changeViewMode(value ? 'preview' : 'edit'))
    }
    const currentValue = useVmoMonacoControlValue(
      () => props.value,
      () => previewMonacos.value[0]?.currentViewMode === 'preview',
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
    return { previewMonacos, currentValue, togglePreview, sourceEditor, changePreviewSource }
  }
})
</script>
