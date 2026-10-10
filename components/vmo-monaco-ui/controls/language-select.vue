<template>
  <span class="languages">
    <select :value="currentValue" @change="handleChange">
      <option v-if="currentValue && !currentLanguages.includes(currentValue)" :value="currentValue" disabled>{{ currentValue }}</option>
      <option v-for="item in currentLanguages" :key="item" :value="item">{{ item }}</option>
    </select>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

export type VmoMonacoLanguageControlValue = string
export type VmoMonacoLanguageControlConfig = {
  languages?: string[]
}

export default defineComponent({
  name: 'vmo-monaco-language-select',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoLanguageControlValue, VmoMonacoLanguageControlConfig>(),
    modelValue: {
      type: String as PropType<string>,
      default: undefined
    },
    languages: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  emits: ['update:value', 'update:modelValue', 'change', 'commit'],
  setup(props, context) {
    const { monacos, editorOption, eachMonaco } = useVmoMonacoControl(props)
    const currentLanguages = computed(() => {
      return props.config?.languages || props.languages
    })
    const currentValue = computed(() => {
      return props.value || props.modelValue || editorOption.value.language || ''
    })

    function handleChange(event: Event) {
      const language = (event.target as HTMLSelectElement).value
      eachMonaco(monaco => {
        monaco.changeLanguage(language)
      })
      context.emit('update:value', language)
      context.emit('update:modelValue', language)
      context.emit('change', language)
      context.emit('commit', {
        type: 'language',
        value: language,
        config: props.config,
        monacoCount: monacos.value.length
      })
    }

    return {
      currentLanguages,
      currentValue,
      handleChange
    }
  }
})
</script>
