<template>
  <span
    :class="['iconButton iconfont', currentValue ? 'vmo-fullscreen-exit' : 'vmo-fullscreen']"
    @click="toggleFullScreen"></span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

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
    const { monacos, eachMonaco } = useVmoMonacoControl(props)
    const currentValue = computed(() => {
      return typeof props.value == 'boolean'
        ? props.value
        : typeof props.config == 'boolean'
          ? props.config
          : props.isFullScreen || !!monacos.value[0]?.isFullScreen
    })

    function toggleFullScreen() {
      const nextValue = !currentValue.value
      monacos.value[0].fullscreenSwitch()
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
