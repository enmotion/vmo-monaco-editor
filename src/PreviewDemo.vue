<script setup lang="ts">
import { ref } from 'vue'
import { VmoTextPreview, VmoCodePreview, VmoMarkdownPreview, VmoMonacoDiffEditor, VmoMonacoUi } from '../index'
import type { VmoPreviewTheme } from '../index'

const editorRef = ref()
const renderer = ref('markdown')
const theme = ref<VmoPreviewTheme>('vs-light')
const unstyled = ref(false)
const customStyle = ref(false)
const content = ref(`# Preview components

Edit the source to update all three previews.

- Plain text preserves newlines.
- Code remains read-only.
- **Markdown** renders the document.

> Default typography can be replaced with your own styles.

| Component | Purpose |
| --- | --- |
| Text | Plain text |
| Code | Syntax highlighting |
| Markdown | Document rendering |

\`\`\`javascript
const greeting = 'Hello preview'
\`\`\`
`)
</script>

<template>
  <main class="preview-demo">
    <h1>Preview components</h1>
    <div class="demo-controls">
      <label>Theme
        <select v-model="theme">
          <option value="vs-light">Light</option>
          <option value="vs-dark">Dark</option>
        </select>
      </label>
      <label><input v-model="unstyled" type="checkbox" /> Unstyled text / Markdown</label>
      <label><input v-model="customStyle" type="checkbox" /> Custom Markdown styles</label>
    </div>
    <label class="source-label">Source<textarea v-model="content" aria-label="Preview source"></textarea></label>
    <section class="demo-integrated">
      <h2>Editor preview mode</h2>
      <label>Preview renderer
        <select v-model="renderer" aria-label="Preview renderer">
          <option value="markdown">Markdown</option>
          <option value="text">Text</option>
          <option value="code">Code</option>
        </select>
      </label>
      <vmo-monaco-diff-editor
        ref="editorRef"
        original-value="# Original draft"
        v-model:modified-value="content"
        :need-confirm="true"
        edit-mode="modified"
        :monaco-options="{ language: 'markdown', theme, minimap: { enabled: false } }"
        style="height: 360px">
        <vmo-monaco-ui :monaco="editorRef" title="Preview demo" :config="{ reviewActions: true, commit: true }" />
        <template #preview="{ content: draft, language, theme: previewTheme }">
          <vmo-markdown-preview v-if="renderer == 'markdown'" :content="draft" :theme="previewTheme" :unstyled="unstyled" :class="{ 'custom-article': customStyle }" />
          <vmo-text-preview v-else-if="renderer == 'text'" :content="draft" :theme="previewTheme" :unstyled="unstyled" />
          <vmo-code-preview v-else :content="draft" :language="language" :theme="previewTheme" style="height: 100%" />
        </template>
      </vmo-monaco-diff-editor>
    </section>
    <div class="demo-grid">
      <section>
        <h2>Text</h2>
        <vmo-text-preview :content="content" :theme="theme" :unstyled="unstyled" />
      </section>
      <section>
        <h2>Code</h2>
        <vmo-code-preview :content="content" language="markdown" :theme="theme" :monaco-options="{ fontSize: 14 }" />
      </section>
      <section>
        <h2>Markdown</h2>
        <vmo-markdown-preview
          :content="content"
          :theme="theme"
          :unstyled="unstyled"
          :class="{ 'custom-article': customStyle }" />
      </section>
    </div>
  </main>
</template>

<style>
.preview-demo { padding: 24px; font-family: system-ui, sans-serif; color: #24292f; }
.preview-demo > h1 { font-size: 24px; font-weight: 600; margin-bottom: 16px; }
.demo-controls { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
.demo-controls label { display: flex; gap: 6px; align-items: center; }
.demo-controls select { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; }
.source-label { display: flex; flex-direction: column; gap: 8px; }
.source-label textarea { height: 160px; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-family: monospace; }
.demo-integrated { margin-top: 20px; border: 1px solid #ccc; border-radius: 6px; }
.demo-integrated > h2, .demo-integrated > label { display: block; padding: 8px 12px; }
.demo-integrated > h2 { font-weight: 600; }
.demo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
.demo-grid section { min-width: 0; border: 1px solid #ccc; border-radius: 6px; overflow: hidden; }
.demo-grid section > h2 { padding: 8px 12px; margin: 0; font-size: 16px; font-weight: 600; background: #f6f8fa; }
.custom-article { --vmo-preview-font-size: 16px; --vmo-preview-padding: 24px; --vmo-preview-color: #5b21b6; --vmo-preview-background: #faf5ff; }
.custom-article h1 { font-size: 1.6em; text-decoration: underline; }
@media (max-width: 900px) { .demo-grid { grid-template-columns: 1fr; } }
</style>
