<template>
  <span :class="['iconButton iconfont vmo-minimap']" @click="toggleMinimap"></span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl, useVmoMonacoControlValue } from './use-monaco-control'

export type VmoMonacoMinimapControlValue = boolean
export type VmoMonacoMinimapControlConfig = boolean

export default defineComponent({
  name: 'vmo-monaco-minimap-toggle',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoMinimapControlValue, VmoMonacoMinimapControlConfig>()
  },
  emits: ['update:value', 'toggle', 'commit'],
  setup(props, context) {
    const { monacos, editorOption, eachMonaco } = useVmoMonacoControl(props)
    const currentValue = useVmoMonacoControlValue(
      () => props.value ?? props.config,
      () => !!editorOption.value.minimap?.enabled,
      value => eachMonaco(monaco => monaco.resetMonacoEditorOptions({ minimap: { enabled: value } }))
    )

    function toggleMinimap() {
      const enabled = !currentValue.value
      currentValue.value = enabled
      eachMonaco(monaco => {
        monaco.resetMonacoEditorOptions({
          minimap: {
            enabled
          }
        })
      })
      context.emit('update:value', enabled)
      context.emit('toggle', enabled)
      context.emit('commit', {
        type: 'minimap',
        value: enabled,
        config: props.config,
        monacoCount: monacos.value.length
      })
    }

    return {
      currentValue,
      toggleMinimap
    }
  }
})
</script>
