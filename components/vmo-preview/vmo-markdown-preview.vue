<template>
  <div
    class="vmo-preview vmo-markdown-preview"
    :class="{ 'is-styled': !unstyled }"
    :data-theme="theme"
    v-html="renderedContent"></div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import MarkdownIt from 'markdown-it'
import type { VmoMarkdownRender, VmoPreviewTheme } from './types'
import './preview.css'

// Reuse the parser. Raw HTML stays escaped; no highlighting dependency is required.
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false })

export default defineComponent({
  name: 'vmo-markdown-preview',
  props: {
    content: { type: String, default: '' },
    theme: { type: String as PropType<VmoPreviewTheme>, default: 'vs-light' },
    unstyled: { type: Boolean, default: false },
    // Custom renderers return trusted HTML and own their sanitization policy.
    render: { type: Function as PropType<VmoMarkdownRender>, default: undefined }
  },
  setup(props) {
    const renderedContent = computed(() => props.render ? props.render(props.content) : markdown.render(props.content))
    return { renderedContent }
  }
})
</script>
