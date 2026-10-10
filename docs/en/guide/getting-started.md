# Getting started

See the [complete component API reference](./api) for all props, emits, instance properties and methods.


```bash
npm i monaco-editor@^0.33.0 ramda@^0.30.1 vue@^3.3.4
npm i vmo-monaco-editor
```

For Vite projects, install the Monaco worker plugin:

```bash
npm i vite-plugin-monaco-editor -D
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  plugins: [
    vue(),
    // @ts-ignore vite-plugin-monaco-editor default export typing may differ by version
    monacoEditorPlugin.default({
      languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript']
    })
  ]
})
```

Import the bundled style once:

```ts
import 'vmo-monaco-editor/dist/style.css'
```

## Package exports


```ts
import {
  VmoMonacoEditor,
  VmoMonacoDiffEditor,
  VmoMonacoUi,
  VmoMonacoCommitButton,
  VmoMonacoFontSizeInput,
  VmoMonacoFullscreenToggle,
  VmoMonacoLanguageSelect,
  VmoMonacoLineNumbersToggle,
  VmoMonacoMinimapToggle,
  VmoMonacoDiffReview,
  VmoMonacoThemeToggle,
  VmoMonacoPreviewToggle,
  VmoTextPreview,
  VmoCodePreview,
  VmoMarkdownPreview,
  useReminderPlugin
} from 'vmo-monaco-editor'
```


## Minimal Vue example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const code = ref('SELECT * FROM table_name')
const editorRef = ref()
</script>

<template>
  <vmo-monaco-editor
    ref="editorRef"
    v-model="code"
    prefix="-- prefix text"
    suffix="-- suffix text"
    :need-confirm="true"
    :monaco-options="{
      theme: 'vs-light',
      language: 'sql',
      fontSize: 14
    }"
    style="height: 400px">
    <vmo-monaco-ui
      title="SQL"
      :monaco="editorRef"
      :config="{
        theme: true,
        lineNumbers: true,
        minimap: true,
        fontSize: true,
        fullScreen: true,
        commit: true
      }" />
  </vmo-monaco-editor>
</template>
```

Set an explicit height; no application Tailwind installation is required. Use empty prefix/suffix strings to hide their default display. For SSR, see [FAQ](./faq).
