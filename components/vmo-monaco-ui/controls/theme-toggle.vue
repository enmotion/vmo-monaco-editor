<template>
  <span
    :class="['iconButton iconfont', currentTheme == 'vs-dark' ? 'vmo-sun' : 'vmo-moon']"
    @click="toggleTheme"></span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

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
    const currentTheme = computed(() => {
      return props.value || props.theme || editorOption.value.theme || props.config || 'vs-light'
    })

    function toggleTheme() {
      const nextTheme: VmoMonacoThemeControlValue = currentTheme.value == 'vs-dark' ? 'vs-light' : 'vs-dark'
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
