<template>
  <div
    class="vmo-preview vmo-text-preview"
    :class="{ 'is-styled': !unstyled }"
    :data-theme="theme">{{ content }}</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { VmoPreviewTheme } from './types'
import './preview.css'

export default defineComponent({
  name: 'vmo-text-preview',
  props: {
    content: { type: String, default: '' },
    theme: { type: String as PropType<VmoPreviewTheme>, default: 'vs-light' },
    unstyled: { type: Boolean, default: false }
  }
})
</script>
