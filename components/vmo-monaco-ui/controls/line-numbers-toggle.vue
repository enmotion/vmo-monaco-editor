<template>
  <span :class="['iconButton iconfont vmo-lines']" @click="toggleLineNumbers"></span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl, useVmoMonacoControlValue } from './use-monaco-control'

export type VmoMonacoLineNumbersControlValue = 'on' | 'off'
export type VmoMonacoLineNumbersControlConfig = VmoMonacoLineNumbersControlValue

export default defineComponent({
  name: 'vmo-monaco-line-numbers-toggle',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoLineNumbersControlValue, VmoMonacoLineNumbersControlConfig>(),
    value: {
      type: String as PropType<VmoMonacoLineNumbersControlValue>,
      default: undefined
    }
  },
  emits: ['update:value', 'toggle', 'commit'],
  setup(props, context) {
    const { monacos, editorOption, eachMonaco } = useVmoMonacoControl(props)
    const currentValue = useVmoMonacoControlValue(
      () => props.value ?? props.config,
      () => editorOption.value.lineNumbers || 'on',
      value => eachMonaco(monaco => monaco.resetMonacoEditorOptions({ lineNumbers: value }))
    )

    function toggleLineNumbers() {
      const lineNumbers: VmoMonacoLineNumbersControlValue = currentValue.value == 'on' ? 'off' : 'on'
      currentValue.value = lineNumbers
      eachMonaco(monaco => {
        monaco.resetMonacoEditorOptions({
          lineNumbers
        })
      })
      context.emit('update:value', lineNumbers)
      context.emit('toggle', lineNumbers)
      context.emit('commit', {
        type: 'lineNumbers',
        value: lineNumbers,
        config: props.config,
        monacoCount: monacos.value.length
      })
    }

    return {
      currentValue,
      toggleLineNumbers
    }
  }
})
</script>
