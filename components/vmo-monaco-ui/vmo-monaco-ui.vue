<template>
  <div :class="['vmo-monaco-ui', monaco?.computedMonacoEditorOption?.theme == 'vs-dark' ? 'dark' : 'light']">
    <span class="title">VMO:Monaco{{ fontsize }}</span>
    <span class="setting">
      <span class="fontsize">
        <span class="iconfont vmo-fontsize"></span>
        <input
          v-model="fontsize"
          class="number"
          type="number"
          @input="
            monaco?.resetMonacoEditorOptions({
              fontSize: fontsize
            })
          " />
      </span>
      <span
        :class="[
          'iconButton iconfont',
          monaco?.computedMonacoEditorOption?.theme == 'vs-dark' ? 'vmo-sun' : 'vmo-moon'
        ]"
        @click="
          monaco?.resetMonacoEditorOptions({
            theme: monaco?.computedMonacoEditorOption?.theme == 'vs-dark' ? 'vs-light' : 'vs-dark'
          })
        "></span>
      <span
        :class="['iconButton iconfont', monaco?.isFullScreen ? 'vmo-fullscreen-exit' : 'vmo-fullscreen']"
        @click="monaco?.fullscreenSwitch()"></span>
      <span
        :class="['iconButton iconfont vmo-minimap']"
        @click="
          monaco?.resetMonacoEditorOptions({
            minimap: {
              enabled: !monaco?.computedMonacoEditorOption?.minimap?.enabled
            }
          })
        "></span>
      <span
        :class="['iconButton iconfont vmo-lines']"
        @click="
          monaco?.resetMonacoEditorOptions({
            lineNumbers: monaco?.computedMonacoEditorOption?.lineNumbers == 'on' ? 'off' : 'on'
          })
        "></span>
      <span :class="['iconButton runningStyle iconfont vmo-running']" @click="monaco?.commit()"></span>
    </span>
  </div>
</template>

<style lang="css">
@import url('//at.alicdn.com/t/c/font_4602780_5emdv444d9r.css');
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
  @apply text-xs font-bold uppercase flex-grow;
}
.vmo-monaco-ui .setting {
  @apply text-xs flex flex-row items-center;
}
.vmo-monaco-ui .iconButton {
  @apply !w-[20px] !h-[20px] shrink-0 rounded flex flex-row items-center justify-center cursor-pointer mr-[10px] last:mr-0;
}
.vmo-monaco-ui.dark .iconButton {
  @apply text-[#FFFFFF88];
}
.vmo-monaco-ui .fontsize {
  @apply h-[20px] flex-row flex items-center mr-[10px] last:mr-0;
}
.vmo-monaco-ui .fontsize .number {
  @apply outline-none !bg-[#88888810] mx-[5px] w-[50px] p-[4px] rounded flex-grow border border-[#88888833] !text-center;
}
.vmo-monaco-ui.dark .fontsize {
  @apply text-[#FFFFFF88];
}
.vmo-monaco-ui .iconButton.runningStyle {
  @apply text-[#00BB55];
}
</style>

<script lang="ts">
import { defineComponent, watch, ref } from 'vue'
import type { PropType } from 'vue'

export type MonacoUIConfig = {
  fontSize: boolean
  theme: boolean
  minimap: boolean
  languages: string[]
}

export default defineComponent({
  name: 'vmo-monaco-ui',
  inheritAttrs: false,
  props: {
    monaco: {
      type: Object as PropType<Record<string, any>> | null,
      default: null
    },
    config: {
      type: Object as PropType<Partial<MonacoUIConfig>>,
      default: () => ({})
    }
  },
  setup(props, context) {
    const fontsize = ref(12 as number)
    watch(
      () => props.monaco,
      n => {
        if (n) {
          fontsize.value = props.monaco.computedMonacoEditorOption?.fontSize
        }
      },
      { immediate: true }
    )
    return {
      fontsize
    }
  }
})
</script>
