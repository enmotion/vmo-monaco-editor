<template>
  <div ref="container" class="vmo-preview vmo-code-preview" :data-theme="theme"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { PropType } from 'vue'
import * as Monaco from 'monaco-editor'
import type { VmoCodePreviewOptions, VmoPreviewTheme } from './types'
import './preview.css'

export default defineComponent({
  name: 'vmo-code-preview',
  props: {
    content: { type: String, default: '' },
    language: { type: String, default: 'plaintext' },
    theme: { type: String as PropType<VmoPreviewTheme>, default: 'vs-light' },
    monacoOptions: { type: Object as PropType<VmoCodePreviewOptions>, default: () => ({}) }
  },
  setup(props) {
    const container = shallowRef<HTMLElement | null>(null)
    let editor: Monaco.editor.IStandaloneCodeEditor | null = null
    let model: Monaco.editor.ITextModel | null = null

    function options(): Monaco.editor.IStandaloneEditorConstructionOptions {
      const { model: _model, value: _value, language: _language, theme: _theme, ...customOptions } =
        props.monacoOptions as Partial<Monaco.editor.IStandaloneEditorConstructionOptions>
      return {
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on',
        ...customOptions,
        // Enforce these after caller options, including untyped JavaScript input.
        readOnly: true,
        domReadOnly: true
      }
    }
    watch(() => props.content, content => {
      if (model && model.getValue() !== content) model.setValue(content)
    })
    watch(() => props.language, language => {
      if (model) Monaco.editor.setModelLanguage(model, language)
    })
    watch(() => props.theme, theme => {
      if (editor) Monaco.editor.setTheme(theme)
    })
    watch(() => props.monacoOptions, () => editor?.updateOptions(options()), { deep: true })

    function dispose() {
      editor?.dispose()
      editor = null
      model?.dispose()
      model = null
    }
    onMounted(() => {
      if (!container.value) return
      model = Monaco.editor.createModel(props.content, props.language)
      try {
        editor = Monaco.editor.create(container.value, { ...options(), model, theme: props.theme })
      } catch (error) {
        dispose()
        throw error
      }
    })
    onBeforeUnmount(dispose)
    return { container }
  }
})
</script>
