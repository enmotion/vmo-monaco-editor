<template>
  <span :class="['iconButton iconfont vmo-lines']" @click="toggleLineNumbers"></span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

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
    const currentValue = computed(() => {
      return props.value || props.config || editorOption.value.lineNumbers || 'on'
    })

    function toggleLineNumbers() {
      const lineNumbers: VmoMonacoLineNumbersControlValue = currentValue.value == 'on' ? 'off' : 'on'
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
      toggleLineNumbers
    }
  }
})
</script>
