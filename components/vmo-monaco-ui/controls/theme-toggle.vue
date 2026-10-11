<template>
  <button
    type="button"
    :title="currentTheme == 'vs-dark' ? '当前深色主题，切换为浅色' : '当前浅色主题，切换为深色'"
    :aria-label="currentTheme == 'vs-dark' ? '切换为浅色主题' : '切换为深色主题'"
    :aria-pressed="currentTheme == 'vs-dark'"
    :class="['iconButton iconfont', currentTheme == 'vs-dark' ? 'vmo-sun' : 'vmo-moon']"
    @click="toggleTheme"></button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl, useVmoMonacoControlValue } from './use-monaco-control'

export type VmoMonacoThemeControlValue = 'vs-dark' | 'vs-light'
export type VmoMonacoThemeControlConfig = VmoMonacoThemeControlValue

export default defineComponent({
  name: 'vmo-monaco-theme-toggle',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoThemeControlValue, VmoMonacoThemeControlConfig>(),
    theme: {
      type: String as PropType<VmoMonacoThemeControlValue>,
      default: undefined
    }
  },
  emits: ['update:value', 'toggle', 'commit'],
  setup(props, context) {
    const { monacos, editorOption, eachMonaco } = useVmoMonacoControl(props)
    const currentTheme = useVmoMonacoControlValue(
      () => props.value ?? props.theme ?? props.config,
      () => editorOption.value.theme || 'vs-light',
      value => eachMonaco(monaco => monaco.resetMonacoEditorOptions({ theme: value }))
    )

    function toggleTheme() {
      const nextTheme: VmoMonacoThemeControlValue = currentTheme.value == 'vs-dark' ? 'vs-light' : 'vs-dark'
      currentTheme.value = nextTheme
      eachMonaco(monaco => {
        monaco.resetMonacoEditorOptions({
          theme: nextTheme
        })
      })
      context.emit('update:value', nextTheme)
      context.emit('toggle', nextTheme)
      context.emit('commit', {
        type: 'theme',
        value: nextTheme,
        config: props.config,
        monacoCount: monacos.value.length
      })
    }

    return {
      currentTheme,
      toggleTheme
    }
  }
})
</script>
