<template>
  <span :class="['iconButton iconfont vmo-minimap']" @click="toggleMinimap"></span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

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
    const currentValue = computed(() => {
      return typeof props.value == 'boolean'
        ? props.value
        : typeof props.config == 'boolean'
          ? props.config
          : !!editorOption.value.minimap?.enabled
    })

    function toggleMinimap() {
      const enabled = !currentValue.value
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
      toggleMinimap
    }
  }
})
</script>
