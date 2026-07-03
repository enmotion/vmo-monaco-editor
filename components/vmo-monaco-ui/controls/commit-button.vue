<template>
  <span :class="['iconButton font-bold text-[#0faa33] iconfont vmo-cloudup']" @click="handleCommit"></span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createVmoMonacoControlProps, useVmoMonacoControl } from './use-monaco-control'

export type VmoMonacoCommitControlValue = unknown
export type VmoMonacoCommitControlConfig = boolean

export default defineComponent({
  name: 'vmo-monaco-commit-button',
  props: {
    ...createVmoMonacoControlProps<VmoMonacoCommitControlValue, VmoMonacoCommitControlConfig>()
  },
  emits: ['commit'],
  setup(props, context) {
    const { monacos } = useVmoMonacoControl(props)

    function handleCommit() {
      const commitTargets = [...monacos.value].reverse()
      commitTargets.forEach(monaco => {
        monaco.commit()
      })
      context.emit('commit', {
        type: 'commit',
        value: props.value,
        config: props.config,
        monacoCount: monacos.value.length
      })
    }

    return {
      handleCommit
    }
  }
})
</script>
