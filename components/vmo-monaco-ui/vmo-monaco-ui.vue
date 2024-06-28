<template>
  <div :class="['vmo-monaco-ui', monaco?.computedMonacoEditorOption?.theme == 'vs-dark' ? 'dark' : 'light']">
    <span class="title">VMO:Monaco</span>
  </div>
</template>

<style lang="css">
.vmo-monaco-ui {
  @apply h-[40px] flex flex-row items-center px-[15px] border-b border-[#88888830];
}
.vmo-monaco-ui.dark {
  @apply bg-[#1C1C1C] text-white;
}
.vmo-monaco-ui.light {
  @apply bg-[#FFFFFF] text-gray-800;
}
.vmo-monaco-ui .title {
  @apply text-xs font-bold uppercase;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

export default defineComponent({
  name: 'vmo-monaco-ui',
  inheritAttrs: false,
  props: {
    monaco: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    }
  },
  setup(props, context) {
    return {}
  }
})
</script>
