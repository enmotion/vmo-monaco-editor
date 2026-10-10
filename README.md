# vmo-monaco-editor

Vue 3 wrapper for `monaco-editor`, with a normal editor, a diff/review editor, and a reusable toolbar layer.

## Install

```bash
npm i monaco-editor ramda vue
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

## Exports

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
  useReminderPlugin
} from 'vmo-monaco-editor'
```

## Normal Editor

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
    class="h-[400px]">
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

When `needConfirm` is `true`, editing does not emit `update:modelValue` immediately. Call `commit()` or use `VmoMonacoCommitButton` / `VmoMonacoUi` commit control to submit the internal value.

### `VmoMonacoEditor` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `'//code content gose here...'` | Editor content. Supports `v-model`. |
| `prefix` | `string` | `'(()=>{})'` | Extra content displayed above the Monaco editor. It is not part of the model. |
| `suffix` | `string` | `'};'` | Extra content displayed below the Monaco editor. It is not part of the model. |
| `needConfirm` | `boolean` | `false` | Delay `update:modelValue` and `change` until `commit()`. |
| `bidibind` | `boolean` | `true` | Sync external `modelValue` changes into the Monaco editor. |
| `zIndex` | `number` | `99` | Container z-index in fullscreen mode. |
| `disabled` | `boolean` | `false` | Sets Monaco `readOnly`. |
| `monacoOptions` | `Partial<IStandaloneEditorConstructionOptions & { theme: 'vs-dark' \| 'vs-light' }>` | `{}` | Monaco editor options. |
| `remindConfig` | `{ language?: 'sql' \| 'python' \| 'groovy'; extra: Partial<VmoMonacoContext> }[]` | `[]` | Completion reminder configuration. |

### `VmoMonacoEditor` Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Emitted on content change when `needConfirm=false`, or by `commit()`. |
| `change` | `string` | Emitted on blur when `needConfirm=false`, or by `commit()`. |
| `focuse` | `void` | Editor focus event. |
| `blur` | `void` | Editor blur event. |

### `VmoMonacoEditor` Exposed Methods

```ts
editorRef.value.insertCodeString(code)
editorRef.value.fullscreenSwitch()
editorRef.value.resetMonacoEditorOptions(options)
editorRef.value.refreshMonacoEditor()
editorRef.value.changeLanguage(language)
editorRef.value.commit()
```

## Diff Editor

`VmoMonacoDiffEditor` manages two stable Monaco models:

- `originalValue`: confirmed/current text
- `modifiedValue`: proposal text

Review actions move content between these two models:

- accept: copy modified change into original
- reject: copy original change into modified
- confirm/commit: emit current original/modified values

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoDiffEditor, VmoMonacoUi } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const original = ref('hello world')
const modified = ref('hello monaco')
const diffRef = ref()
</script>

<template>
  <vmo-monaco-diff-editor
    ref="diffRef"
    v-model:original-value="original"
    v-model:modified-value="modified"
    :need-confirm="true"
    display-mode="diff"
    diff-view-mode="inline"
    :editable-original="true"
    :editable-modified="true"
    :monaco-options="{
      theme: 'vs-light',
      language: 'plaintext',
      wordWrap: 'on',
      minimap: { enabled: false }
    }"
    class="h-[500px]">
    <vmo-monaco-ui
      title="Review"
      :monaco="diffRef"
      :config="{
        theme: true,
        lineNumbers: true,
        fontSize: true,
        fullScreen: true,
        reviewActions: true,
        commit: true
      }" />
  </vmo-monaco-diff-editor>
</template>
```

### `needConfirm` in Diff Review

When `needConfirm=true`, normal edits and review actions update internal models only. They do not emit `update:originalValue` / `update:modifiedValue` until `confirm()` or `commit()` is called.

Review events such as `accept-all` and `reject-change` still emit so the host app can react to internal review operations.

### `VmoMonacoDiffEditor` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `originalValue` | `string` | `''` | Original/confirmed text. Supports `v-model:original-value`. |
| `modifiedValue` | `string` | `''` | Modified/proposal text. Supports `v-model:modified-value`. |
| `prefix` | `string` | `''` | Extra content above the editor. |
| `suffix` | `string` | `''` | Extra content below the editor. |
| `displayMode` | `'original' \| 'modified' \| 'diff'` | `'diff'` | Show original, modified, or diff editor. |
| `diffViewMode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | Diff rendering mode. |
| `editableOriginal` | `boolean` | `false` | Allow editing original side/model. |
| `editableModified` | `boolean` | `true` | Allow editing modified side/model. |
| `needConfirm` | `boolean` | `false` | Delay value updates until `confirm()` / `commit()`. |
| `bidibind` | `boolean` | `true` | Sync external prop changes into internal models. |
| `zIndex` | `number` | `99` | Container z-index in fullscreen mode. |
| `disabled` | `boolean` | `false` | Readonly state for editor views. |
| `originalUri` | `string` | `'vmo-monaco-diff-original'` | URI identity for original model. |
| `modifiedUri` | `string` | `'vmo-monaco-diff-modified'` | URI identity for modified model. |
| `monacoOptions` | `Partial<IStandaloneEditorConstructionOptions & { theme: 'vs-dark' \| 'vs-light' }>` | `{}` | Shared Monaco editor options. |
| `diffOptions` | `Partial<IStandaloneDiffEditorConstructionOptions>` | `{}` | Diff editor options. |
| `showReviewActions` | `boolean` | `true` | Enables native Monaco `+/-` review click handling. |

### `VmoMonacoDiffEditor` Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:originalValue` | `string` | Emitted when original value is submitted. |
| `update:modifiedValue` | `string` | Emitted when modified value is submitted. |
| `change` | `{ originalValue: string; modifiedValue: string }` | Current pair of values. |
| `accept-change` | `{ index?: number; lineChange?: ILineChange; originalValue: string; modifiedValue: string }` | Single diff block accepted. |
| `reject-change` | `{ index?: number; lineChange?: ILineChange; originalValue: string; modifiedValue: string }` | Single diff block rejected. |
| `accept-all` | `{ originalValue: string; modifiedValue: string }` | All changes accepted. |
| `reject-all` | `{ originalValue: string; modifiedValue: string }` | All changes rejected. |
| `confirm` | `{ originalValue: string; modifiedValue: string; confirmedValue: string }` | Current result confirmed. `confirmedValue` is the original model value. |
| `focuse` | `void` | Editor focus event. |
| `blur` | `void` | Editor blur event. |
| `mode-change` | `'original' \| 'modified' \| 'diff'` | Display mode changed. |

### `VmoMonacoDiffEditor` Exposed Methods

```ts
diffRef.value.resetMonacoEditorOptions(options)
diffRef.value.resetMonacoDiffEditorOptions(options)
diffRef.value.fullscreenSwitch()
diffRef.value.changeLanguage(language)
diffRef.value.changeDisplayMode('diff')
diffRef.value.changeDiffViewMode('inline')
diffRef.value.acceptChange(index)
diffRef.value.rejectChange(index)
diffRef.value.acceptAllChanges()
diffRef.value.rejectAllChanges()
diffRef.value.confirm()
diffRef.value.commit()
diffRef.value.getLineChanges()
diffRef.value.getOriginalEditor()
diffRef.value.getModifiedEditor()
diffRef.value.getDiffEditor()
```

## Toolbar UI

`VmoMonacoUi` is a toolbar container. It receives one editor instance or an array of editor instances through `monaco`, then provides that context to inner controls.

```vue
<vmo-monaco-ui
  title="Editor"
  :monaco="editorRef"
  :config="{
    theme: true,
    lineNumbers: true,
    minimap: true,
    fontSize: { min: 10, max: 32, step: 1 },
    fullScreen: true,
    commit: true,
    language: { languages: ['sql', 'javascript', 'typescript'] },
    languages: ['sql', 'javascript', 'typescript']
  }" />
```

For a diff editor, enable the review popover:

```vue
<vmo-monaco-ui
  :monaco="diffRef"
  :config="{
    reviewActions: true,
    commit: true,
    theme: true,
    fontSize: true
  }" />
```

If `monaco` is an array, control actions apply to all targets. For `commit`, targets are committed in reverse order so the first item is treated as the primary editor and commits last.

### UI Config

| Key | Type | Description |
| --- | --- | --- |
| `fontSize` | `boolean \| { min?: number; max?: number; step?: number }` | Show font size input. |
| `theme` | `boolean \| 'vs-dark' \| 'vs-light'` | Show theme toggle. |
| `minimap` | `boolean` | Show minimap toggle. |
| `lineNumbers` | `boolean \| 'on' \| 'off'` | Show line number toggle. |
| `fullScreen` | `boolean` | Show fullscreen toggle. |
| `commit` | `boolean` | Show commit button. |
| `reviewActions` | `boolean` | Show diff review popover. Requires a diff editor target. |
| `language` | `boolean \| { languages?: string[] }` | Language select control config. |
| `languages` | `string[]` | Shortcut language list for language select. |

### Custom Toolbar Slot

You can replace the default toolbar layout and still use controls through injection:

```vue
<vmo-monaco-ui :monaco="diffRef">
  <div class="flex flex-row items-center justify-between grow">
    <span>Review</span>
    <span class="flex flex-row items-center">
      <vmo-monaco-commit-button />
      <vmo-monaco-diff-review />
      <vmo-monaco-font-size-input />
      <vmo-monaco-theme-toggle />
    </span>
  </div>
</vmo-monaco-ui>
```

Controls can also be used outside `VmoMonacoUi` by passing `:monaco="editorRef"` directly.

## Diff Review Control

`VmoMonacoDiffReview` renders a compare icon. Clicking it opens a popover with icon-only actions:

- original / proposal / diff display mode
- original / proposal modes: live diff block count (`…` while calculating)
- diff mode: side-by-side / inline layout and reject all / accept all

Bulk review buttons are disabled while differences are being calculated or when there are no differences. Switching modes keeps the popover open. Single-model views continue calculating differences using a detached Monaco diff view.

It also exposes a `review-actions` slot through `VmoMonacoUi`:

```vue
<vmo-monaco-ui :monaco="diffRef" :config="{ reviewActions: true }">
  <template #review-actions="{ lineChanges, acceptAllChanges, rejectAllChanges, changeDisplayMode }">
    <button @click="changeDisplayMode('diff')">Diff</button>
    <button @click="rejectAllChanges()">Reject {{ lineChanges.length }}</button>
    <button @click="acceptAllChanges()">Accept</button>
  </template>
</vmo-monaco-ui>
```

## Reminder Plugins

`useReminderPlugin(language)` returns a completion provider factory for built-in reminder languages:

```ts
const sqlReminder = useReminderPlugin('sql')
const pythonReminder = useReminderPlugin('python')
const groovyReminder = useReminderPlugin('groovy')
const defaultReminder = useReminderPlugin()
```

Usually you do not call this directly. Pass `remindConfig` to `VmoMonacoEditor`:

```vue
<vmo-monaco-editor
  v-model="code"
  :remind-config="[
    {
      language: 'sql',
      extra: {
        properties: ['table_a', 'table_b'],
        methods: ['COUNT', 'SUM']
      }
    }
  ]" />
```

## Type Exports

The package exports public types such as:

```ts
import type {
  VmoMonacoEditorExpose,
  VmoMonacoDiffEditorExpose,
  VmoMonacoEditorOption,
  VmoMonacoDiffChangePayload,
  VmoMonacoDiffConfirmPayload,
  VmoMonacoDiffReviewActionPayload,
  VmoMonacoDiffDisplayMode,
  VmoMonacoDiffViewMode,
  VmoMonacoControlTarget
} from 'vmo-monaco-editor'
```

## Notes

- The editor components use `Teleport` in fullscreen mode to avoid parent layout clipping.
- `prefix` and `suffix` are displayed outside Monaco and are not part of the editor model.
- Monaco theme is global. Switching theme in one editor affects Monaco theme rendering globally.
- The native diff `+/-` actions are handled by `VmoMonacoDiffEditor` when `showReviewActions=true`.
