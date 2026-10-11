<template>
  <span
    :class="['iconButton iconfont', currentValue ? 'vmo-fullscreen-exit' : 'vmo-fullscreen']"
    @click="toggleFullScreen"></span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl, useVmoMonacoControlValue } from './use-monaco-control'

export type VmoMonacoFullScreenControlValue = boolean
export type VmoMonacoFullScreenControlConfig = boolean

export default defineComponent({
  name: 'vmo-monaco-fullscreen-toggle',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoFullScreenControlValue, VmoMonacoFullScreenControlConfig>(),
    isFullScreen: {
      type: Boolean,
      default: undefined
    }
  },
  emits: ['update:value', 'toggle', 'commit'],
  setup(props, context) {
    const { monacos } = useVmoMonacoControl(props)
    function applyFullScreen(value: boolean) {
      const monaco = monacos.value[0]
      if (monaco && !!monaco.isFullScreen !== value) monaco.fullscreenSwitch()
    }
    const currentValue = useVmoMonacoControlValue(
      () => props.value ?? props.config ?? props.isFullScreen,
      () => !!monacos.value[0]?.isFullScreen,
      applyFullScreen
    )

    function toggleFullScreen() {
      const monaco = monacos.value[0]
      if (!monaco) return
      const nextValue = !currentValue.value
      currentValue.value = nextValue
      applyFullScreen(nextValue)
      context.emit('update:value', nextValue)
      context.emit('toggle', nextValue)
      context.emit('commit', {
        type: 'fullScreen',
        value: nextValue,
        config: props.config,
        monacoCount: monacos.value.length
      })
    }

    return {
      currentValue,
      toggleFullScreen
    }
  }
})
</script>
