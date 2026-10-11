<template>
  <span class="fontsize">
    <span class="iconfont vmo-fontsize"></span>
    <input
      :value="currentValue"
      class="number"
      aria-label="编辑器字号（像素）"
      title="字号（px）"
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
import { createVmoMonacoControlProps, useVmoMonacoControl, useVmoMonacoControlValue } from './use-monaco-control'

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
    const currentValue = useVmoMonacoControlValue(
      () => props.value ?? props.modelValue,
      () => editorOption.value.fontSize || 12,
      value => eachMonaco(monaco => monaco.resetMonacoEditorOptions({ fontSize: value }))
    )

    function handleInput(event: Event) {
      const fontSize = Number((event.target as HTMLInputElement).value)
      currentValue.value = fontSize
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
