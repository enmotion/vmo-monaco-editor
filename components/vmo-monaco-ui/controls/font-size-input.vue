<template>
  <span class="fontsize">
    <span class="iconfont vmo-fontsize"></span>
    <input
      :value="currentValue"
      class="number"
      type="number"
      :min="inputConfig.min"
      :max="inputConfig.max"
      :step="inputConfig.step"
      @input="handleInput" />
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

export type VmoMonacoFontSizeControlValue = number
export type VmoMonacoFontSizeControlConfig = {
  min?: number
  max?: number
  step?: number
}

export default defineComponent({
  name: 'vmo-monaco-font-size-input',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoFontSizeControlValue, VmoMonacoFontSizeControlConfig>(),
    modelValue: {
      type: Number as PropType<number>,
      default: undefined
    }
  },
  emits: ['update:value', 'update:modelValue', 'commit'],
  setup(props, context) {
    const { monacos, editorOption, eachMonaco } = useVmoMonacoControl(props)
    const inputConfig = computed(() => {
      return {
        min: 6,
        max: 100,
        step: 1,
        ...props.config
      }
    })
    const currentValue = computed(() => {
      return props.value || props.modelValue || editorOption.value.fontSize || 12
    })

    function handleInput(event: Event) {
      const fontSize = Number((event.target as HTMLInputElement).value)
      eachMonaco(monaco => {
        monaco.resetMonacoEditorOptions({
          fontSize
        })
      })
      context.emit('update:value', fontSize)
      context.emit('update:modelValue', fontSize)
      context.emit('commit', {
        type: 'fontSize',
        value: fontSize,
        config: props.config,
        monacoCount: monacos.value.length
      })
    }

    return {
      inputConfig,
      currentValue,
      handleInput
    }
  }
})
</script>
