# vmo-monaco-editor

## 独立的视图状态与内容状态

两个编辑器都提供 `viewMode: 'edit' | 'preview'`，支持 `v-model:view-mode`、`update:viewMode` 与 `view-mode-change`。差异编辑器另提供 `editMode: 'original' | 'modified' | 'diff'`，支持 `v-model:edit-mode`、`update:editMode` 与 `edit-mode-change`。改变任一状态不会改变另一状态。`diffViewMode` 仅表示比对布局，`previewSource` 仅表示预览草稿来源。props 初始化内部状态，外部实际改变时同步；外部不回写则保留内部操作结果。

两个编辑器的插槽一致：`default`、`prefix`、`preview`、`suffix`。preview 参数为 `{ content, language, source, theme }`，普通编辑器的 source 固定为 original。没有 preview 插槽时无法进入预览；移除插槽会返回 edit，保留差异编辑器的 editMode。普通编辑器切换时保留 Monaco 实例和草稿。

```vue
<VmoMonacoEditor v-model="body" v-model:view-mode="viewMode">
  <template #preview="{ content, language, source, theme }">
    <VmoTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoEditor>
<VmoMonacoDiffEditor
  v-model:original-value="body" v-model:modified-value="proposal"
  v-model:view-mode="viewMode" v-model:edit-mode="editMode">
  <template #preview="{ content, language, source, theme }">
    <VmoTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoDiffEditor>
```


[中文文档](https://enmotion.github.io/vmo-monaco-editor/) · [完整组件 API](https://enmotion.github.io/vmo-monaco-editor/guide/api) · [English documentation](https://enmotion.github.io/vmo-monaco-editor/en/) · [Complete API reference](https://enmotion.github.io/vmo-monaco-editor/en/guide/api)

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

## Options and fullscreen bindings

Content uses `v-model`. Theme, font size, language, line numbers and minimap are fields of `monacoOptions`, returned through `v-model:monaco-options`. Fullscreen uses `v-model:full-screen`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi } from 'vmo-monaco-editor'
import type { VmoMonacoEditorOption } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'
const code = ref('SELECT * FROM users')
const editorRef = ref()
const editorOptions = ref<VmoMonacoEditorOption>({ language: 'sql', theme: 'vs-light', fontSize: 14 })
const fullScreen = ref(false)
</script>

<template>
  <VmoMonacoEditor ref="editorRef" v-model="code"
    v-model:monaco-options="editorOptions" v-model:full-screen="fullScreen"
    prefix="" suffix="" style="height: 400px">
    <VmoMonacoUi :monaco="editorRef" />
  </VmoMonacoEditor>
</template>
```

Props initialize local state. Internal actions take effect immediately and emit updates even if the parent does not write them back. Only actual external changes override local state; equivalent option objects preserve toolbar choices. Options synchronize by top-level field, with nested objects treated as entire fields. Removing an external field removes its internal override. `needConfirm` and `bidibind` govern text submission/synchronization only; they do not delay or block option or fullscreen updates. Normal editor readonly state is `disabled || monacoOptions.readOnly`, exposed as `currentReadOnly`.

### `VmoMonacoEditor` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `'//code content gose here...'` | Editor content. Supports `v-model`. |
| `prefix` | `string` | `'(()=>{})'` | Extra content displayed above the Monaco editor. It is not part of the model. |
| `suffix` | `string` | `'};'` | Extra content displayed below the Monaco editor. It is not part of the model. |
| `needConfirm` | `boolean` | `false` | Delay `update:modelValue` and `change` until `commit()`. |
| `bidibind` | `boolean` | `true` | Sync external `modelValue` changes into the Monaco editor. |
| `fullScreen` | `boolean` | `false` | Fullscreen state; supports `v-model:full-screen`. |
| `zIndex` | `number` | `99` | Container z-index in fullscreen mode. |
| `disabled` | `boolean` | `false` | Sets Monaco `readOnly`. |
| `monacoOptions` | `Partial<IStandaloneEditorConstructionOptions & { theme: 'vs-dark' \| 'vs-light' }>` | `{}` | Monaco editor options. |
| `remindConfig` | `{ language?: 'sql' \| 'python' \| 'groovy'; extra: Partial<VmoMonacoContext> }[]` | `[]` | Completion reminder configuration. |

### `VmoMonacoEditor` Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Emitted on content change when `needConfirm=false`, or by `commit()`. |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | Controls or API change options; independent snapshots. |
| `update:fullScreen` / `fullscreen-change` | `boolean` | Fullscreen state actually changes. |
| `change` | `string` | Emitted on blur when `needConfirm=false`, or by `commit()`. |
| `focuse` | `void` | Editor focus event. |
| `blur` | `void` | Editor blur event. |

### `VmoMonacoEditor` Exposed Methods

```ts
editorRef.value.insertCodeString(code)
editorRef.value.changeFullScreen(true)
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
    edit-mode="diff"
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

## Display state and two-way bindings

The UI separates content (original, proposal, diff) from interaction mode (edit, readonly, preview). The API uses independent viewMode and editMode; `previewSource` selects the previewed content. `disabled`, `editableOriginal` and `editableModified` determine editing permissions; `currentReadOnly` exposes the current view's editing restriction.

| State | Prop / v-model | Update event |
| --- | --- | --- |
| Edit / preview | `viewMode` / `v-model:view-mode` | `update:viewMode` |
| Original / proposal / diff | `editMode` / `v-model:edit-mode` | `update:editMode` |
| Preview original / proposal | `previewSource` / `v-model:preview-source` | `update:previewSource` |
| Side-by-side / inline | `diffViewMode` / `v-model:diff-view-mode` | `update:diffViewMode` |
| Theme / font size / language / line numbers / minimap | `monacoOptions` / `v-model:monaco-options` | `update:monacoOptions` |
| Diff options | `diffOptions` / `v-model:diff-options` | `update:diffOptions` |
| Fullscreen | `fullScreen` / `v-model:full-screen` | `update:fullScreen` |

Props initialize local state. Internal actions update it before emitting events. Without parent writeback, local changes remain effective; actual external changes override them. `monacoOptions` and `diffOptions` synchronize by top-level field, treating nested objects as entire fields. Equivalent rerenders preserve local settings. Repeatedly setting the same internal state does not duplicate editor state update events.

```vue
<VmoMonacoDiffEditor
  v-model:edit-mode="editMode" v-model:view-mode="viewMode"
  v-model:preview-source="previewSource"
  v-model:diff-view-mode="diffViewMode"
  v-model:monaco-options="editorOptions"
  v-model:diff-options="diffOptions"
  v-model:full-screen="fullScreen">
  <template #preview="{ content }"><pre>{{ content }}</pre></template>
</VmoMonacoDiffEditor>
```

Define the binding variables in the parent: for example `'diff'`, `'modified'`, `'side-by-side'`, `{}`, `{}` and `false`, respectively. See the [complete toolbar binding example](docs/en/guide/toolbar.md#state-bindings). `needConfirm` delays original/proposal content submission only; all state updates remain immediate. Preview requires a `preview` slot.

To receive notifications without writing back, use `:edit-mode="editMode" @update:edit-mode="handleMode($event)"`. `edit-mode-change`, `view-mode-change`, and `preview-source-change` independently notify their state changes, alongside `diff-view-mode-change`, `options-change`, `diff-options-change` and `fullscreen-change`. Listen on the editor itself for changes initiated by the default toolbar; UI forwarding is unnecessary.

### `VmoMonacoDiffEditor` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `originalValue` | `string` | `''` | Original/confirmed text. Supports `v-model:original-value`. |
| `modifiedValue` | `string` | `''` | Modified/proposal text. Supports `v-model:modified-value`. |
| `prefix` | `string` | `''` | Extra content above the editor. |
| `suffix` | `string` | `''` | Extra content below the editor. |
| `previewSource` | `'original' \| 'modified'` | Unset | Override the source selected when entering preview; supports external updates. |
| `diffViewMode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | Diff rendering mode. |
| `editableOriginal` | `boolean` | `false` | Allow editing original side/model. |
| `editableModified` | `boolean` | `true` | Allow editing modified side/model. |
| `needConfirm` | `boolean` | `false` | Delay value updates until `confirm()` / `commit()`. |
| `bidibind` | `boolean` | `true` | Sync external prop changes into internal models. |
| `fullScreen` | `boolean` | `false` | Fullscreen state; supports `v-model:full-screen`. |
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
| `update:previewSource` | original / modified | Actual preview source changes. |
| `update:diffViewMode` / `diff-view-mode-change` | side-by-side / inline | Actual diff layout changes. |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | Controls or API change shared options. |
| `update:diffOptions` / `diff-options-change` | Diff options object | API changes diff options. |
| `update:fullScreen` / `fullscreen-change` | `boolean` | Actual fullscreen state changes. |
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
| `preview-source-change` | `'original' \| 'modified'` | Preview source changed. |

### `VmoMonacoDiffEditor` Exposed Methods

```ts
diffRef.value.resetMonacoEditorOptions(options)
diffRef.value.resetMonacoDiffEditorOptions(options)
diffRef.value.changeFullScreen(true)
diffRef.value.fullscreenSwitch()
diffRef.value.changeLanguage(language)
diffRef.value.changeEditMode('diff')
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

The persistent status row separates content (original/proposal/diff) from interaction mode (edit/readonly/preview), highlights the actual preview source and shows side-by-side/inline layout for diff. Current language, font size in px, theme and pending confirmation stay visible even when the corresponding setting controls are hidden. A custom default slot replaces only the upper controls and preserves the status row. UI config is for control visibility; the editor's props are the state bindings.

Standalone setting controls support `v-model:value`, with `v-model` aliases for font size and language. They retain internal actions without parent writeback and synchronize actual external changes to the target. Control interaction events are not forwarded by `VmoMonacoUi`; editor `update:*` events are emitted directly by the editor.

If `monaco` is an array, option controls apply to all targets; fullscreen switches only the first target, while preview/review controls filter for compatible targets. For `commit`, targets are committed in reverse order so the first item is treated as the primary editor and commits last.

### UI Config

| Key | Type | Description |
| --- | --- | --- |
| `fontSize` | `boolean \| { min?: number; max?: number; step?: number }` | Show font size input. |
| `theme` | `boolean \| 'vs-dark' \| 'vs-light'` | Show theme toggle. |
| `minimap` | `boolean` | Show minimap toggle. |
| `lineNumbers` | `boolean \| 'on' \| 'off'` | Show line number toggle. |
| `fullScreen` | `boolean` | Show fullscreen toggle. |
| `commit` | `boolean` | Show commit button. |
| `preview` | `boolean` | Show the standalone preview toggle when a preview slot exists; defaults to automatic, `false` hides it. |
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
  <template #review-actions="{ lineChanges, acceptAllChanges, rejectAllChanges, changeEditMode }">
    <button @click="changeEditMode('diff')">Diff</button>
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
  VmoMonacoDiffEditMode,
  VmoMonacoViewMode,
  VmoMonacoDiffViewMode,
  VmoMonacoControlTarget
} from 'vmo-monaco-editor'
```

## Notes

- The editor components use `Teleport` in fullscreen mode to avoid parent layout clipping.
- `prefix` and `suffix` are displayed outside Monaco and are not part of the editor model.
- Monaco theme is global. Switching theme in one editor affects Monaco theme rendering globally.
- The native diff `+/-` actions are handled by `VmoMonacoDiffEditor` when `showReviewActions=true`.

## Preview Components

Three standalone components are exported: `VmoTextPreview`, `VmoCodePreview`, and
`VmoMarkdownPreview`. They can be placed inside a preview slot or used on their own.
`VmoMonacoDiffEditor` provides a `#preview` slot and a `preview` display mode.
When the slot is supplied, the status row includes a preview toggle. Click “返回编辑器” (return to editor) to restore the previous editor view. Without the slot, the toggle is hidden and preview is unavailable. UI `preview: false` hides the status-row toggle. A custom `VmoMonacoUi` default slot replaces only the upper controls, so the status row and its preview toggle remain. When building an entirely separate toolbar, use the exported `VmoMonacoPreviewToggle`, which supports a direct `monaco` prop and custom button content.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoTextPreview, VmoCodePreview, VmoMarkdownPreview } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const markdown = ref('# Hello\n\n**Markdown** preview')
const code = ref('const message = "Hello"')
</script>

<template>
  <vmo-text-preview :content="markdown" />
  <vmo-code-preview :content="code" language="javascript" theme="vs-light" />
  <vmo-markdown-preview :content="markdown" theme="vs-light" />
</template>
```

| Prop | Components | Default | Description |
| --- | --- | --- | --- |
| `content` | All | `''` | Current text to display; updates reactively. |
| `theme` | All | `'vs-light'` | `'vs-light'` or `'vs-dark'`. Monaco themes remain global. |
| `unstyled` | Text, Markdown | `false` | Omit the default typography, colors and spacing. Text still preserves newlines. |
| `language` | Code | `'plaintext'` | Monaco model language. |
| `monacoOptions` | Code | `{}` | Optional Monaco settings. Content/model, language, theme and readonly state are managed by the component. |
| `render` | Markdown | Built-in renderer | Optional synchronous `(content: string) => string` returning trusted HTML. |

Code preview uses the same Monaco worker setup as the editors. It defaults to
readonly, wrapped lines, font size 14, and no minimap. Selection and copying remain
available. Its default height is 320px; use `class`, `style`, or
`--vmo-preview-code-height` to change it. Editor and owned model are disposed on
unmount.

Markdown uses `markdown-it` with raw HTML disabled. Tables, lists, quotations and
fenced code blocks work out of the box; code blocks use plain monospace formatting
without an additional syntax-highlighting library. A custom render function owns
its HTML escaping/sanitization policy. For example, pass a configured parser:

```ts
import MarkdownIt from 'markdown-it'
const parser = new MarkdownIt({ html: false, breaks: true })
const renderMarkdown = (content: string) => parser.render(content)
```

```vue
<vmo-markdown-preview :content="markdown" :render="renderMarkdown" />
```

### Override Preview Styles

`class` and `style` are forwarded to the root element. Default text/Markdown styles
use a single class of specificity and no `!important`. Import application styles
after the library CSS, or use selectors such as `.my-article h1` for element styling.
For complete control, set `unstyled` on text/Markdown previews.

```vue
<vmo-markdown-preview
  :content="markdown"
  class="my-article"
  style="--vmo-preview-font-size: 16px; --vmo-preview-padding: 24px" />
```

```css
.my-article {
  --vmo-preview-color: #334155;
  --vmo-preview-background: #f8fafc;
  --vmo-preview-line-height: 1.8;
}
.my-article h1 { font-size: 1.6em; }
/* In a Vue scoped style, use .my-article :deep(h1) for generated Markdown. */
```

Text/Markdown CSS variables: `--vmo-preview-color`, `--vmo-preview-background`,
`--vmo-preview-font-family`, `--vmo-preview-font-size`, `--vmo-preview-line-height`,
`--vmo-preview-padding`. Markdown also supports `--vmo-preview-block-gap`,
`--vmo-preview-muted`, `--vmo-preview-border`, `--vmo-preview-link-color`,
`--vmo-preview-code-font-family`, and `--vmo-preview-code-background`.
Code typography is configured with `monacoOptions`.

Run `npm run dev` and open `/preview.html` for the interactive example with content,
theme, unstyled and custom-style controls.


### Editor Preview EditMode

```vue
<vmo-monaco-diff-editor
  ref="diffRef"
  v-model:original-value="original"
  v-model:modified-value="proposal"
  :need-confirm="true"
  :monaco-options="{ language: 'markdown', theme: 'vs-light' }"
  style="height: 500px">
  <vmo-monaco-ui :monaco="diffRef" :config="{ reviewActions: true }" />
  <template #preview="{ content, language, source, theme }">
    <vmo-markdown-preview :content="content" :theme="theme" />
  </template>
</vmo-monaco-diff-editor>
```

The slot receives `content` (the internal current draft, including uncommitted
edits), `language`, `source` (`original` or `modified`), and `theme`. Use any of the
three preview components or your own renderer inside it.

Without an explicit `previewSource`, entering preview from Original selects the original draft; entering from Proposal or Diff selects the proposal. An explicit source prop initializes the source and synchronizes on actual external changes. Local source changes remain effective while that prop is unchanged, including on re-entry into preview. The status row changes editMode independently; the preview source buttons change previewSource without leaving preview. Preview does not commit text or replace the two models. Removing the slot returns to edit and preserves editMode.

Use `v-model:view-mode` and `v-model:preview-source` to track view and source, or listen to `@update:view-mode="handleMode($event)"` and `@update:preview-source="handleSource($event)"` without writing back. The editor emits `view-mode-change` and `preview-source-change` notifications independently. Neither `needConfirm` nor `bidibind` delays these state updates. Preview itself has no editable input; `currentReadOnly` describes the editor view's editing permission.

The public API includes `togglePreview()`, `changeViewMode('preview')`,
`changePreviewSource('original' | 'modified')`, `hasPreview`, and
`currentPreviewSource`. Initial `viewMode="preview"` is also supported when the
slot is present. An initial preview mode without a slot falls back to edit, preserving editMode.


### Language Selection

Both UI configurations below enable the same selector:

```vue
<vmo-monaco-ui :monaco="editorRef" :config="{ languages: ['sql', 'javascript'] }" />
<vmo-monaco-ui :monaco="editorRef" :config="{ language: { languages: ['sql', 'javascript'] } }" />
```

Use `language: false` to explicitly hide the selector. A single configured language
also hides it. If the current editor language is outside the configured choices,
it is displayed as a disabled current-language option until another is selected.

Toolbar language choices persist when the parent rerenders equivalent inline
`monacoOptions`. Actual external option changes still apply, including in-place
language updates; changing another external field preserves the selected language.
Language changes update both diff models and the preview slot's `language` value.

## Documentation development

```bash
npm run docs:dev
npm run docs:build
npm run docs:preview
```

Bilingual VitePress sources live in `docs/`. GitHub Pages deploys through `.github/workflows/docs.yml` on pushes to `master`.


## Component slots

| Component | Slots | Props and fallback |
| --- | --- | --- |
| VmoMonacoEditor | default; prefix; suffix; preview | default: no props, toolbar above editor. prefix/suffix: `{ option }`, current merged options; fallback renders the corresponding HTML prop outside the model. preview: `{ content, language, source, theme }`; source is original |
| VmoMonacoDiffEditor | default; prefix; suffix; preview | Same editor slots; preview: `{ content, language, source, theme }`, internal draft including uncommitted edits; no built-in content renderer, only renders in preview mode |
| VmoMonacoUi | default; review-actions | default: no props, replaces upper controls but preserves status row/injection. review-actions: review props below, replaces built-in popover content when config.reviewActions is enabled and the menu is open |
| VmoMonacoDiffReview | default | Review props below; replaces an open popover's content while retaining trigger, container and outside-click closing |
| VmoMonacoPreviewToggle | default | `{ active: boolean }`, current preview state; replaces button text only, retaining icon, click and accessibility behavior. Fallback: preview/return-to-editor text; hidden without a capable target |
| VmoMonacoCommitButton, VmoMonacoFontSizeInput, VmoMonacoLanguageSelect, VmoMonacoThemeToggle, VmoMonacoFullscreenToggle, VmoMonacoLineNumbersToggle, VmoMonacoMinimapToggle | None | Supplied slot content is not rendered |
| VmoTextPreview, VmoCodePreview, VmoMarkdownPreview | None | Use content/render/monacoOptions props instead |

Review slot props are identical for UI review-actions and standalone review default:

| Parameter | Type | Meaning |
| --- | --- | --- |
| `lineChanges` | `Monaco.editor.ILineChange[]` | Current diff blocks from the first diff target; avoid stale indexes during calculation |
| `diffPending` | `boolean` | Whether the latest diff is still calculating |
| `currentEditMode` | `EditMode` | Current display mode |
| `currentViewMode` | `ViewMode` | 当前编辑／预览状态，独立于 editMode |
| `hasPreview` | `boolean` | Whether the first diff target provides a preview slot |
| `acceptChange` | `(index: number) => void` | Accept a block from the current diff array |
| `rejectChange` | `(index: number) => void` | Reject a block from the current diff array |
| `acceptAllChanges` | `() => void` | Accept all changes |
| `rejectAllChanges` | `() => void` | Reject all changes |
| `changeEditMode` | `(mode: EditMode) => void` | Select original/proposal/diff without changing viewMode or previewSource |
| `changeDiffViewMode` | `(mode: LayoutMode) => void` | Switch side-by-side/inline layout |
| `confirm` | `() => void` | Confirm the current content |

Destructure camelCase names even though template bindings use kebab-case. The slot does not supply `canReview`, `currentDiffViewMode` or `closePanel`. Disable bulk buttons using `diffPending || !lineChanges.length`; the methods themselves do not enforce this condition.

```vue
<VmoMonacoDiffReview :monaco="diffRef">
  <template #default="{ lineChanges, diffPending, acceptAllChanges, rejectAllChanges, confirm }">
    <span>{{ diffPending ? '…' : lineChanges.length }}</span>
    <button :disabled="diffPending || !lineChanges.length" @click="rejectAllChanges()">Reject all</button>
    <button :disabled="diffPending || !lineChanges.length" @click="acceptAllChanges()">Accept all</button>
    <button @click="confirm()">Confirm</button>
  </template>
</VmoMonacoDiffReview>
```

With a custom UI default slot, review-actions is not automatically forwarded to a manually inserted review control; use that control's default slot. Prefix/suffix slots replace only their extra-content regions. Preview replaces only its content region, retaining the outer preview container/source buttons.

See the per-component slot tables and examples in the [Chinese API reference](docs/guide/api.md) and [English API reference](docs/en/guide/api.md).


### Shared state implementation / 共同状态实现

两个编辑器复用内部配置与全屏组合函数；props、事件、方法和插槽契约保持不变。配置内部变化发出独立事件快照，相同值不重复发出事件，等价外部配置保留内部选择。维护说明与完整行为规则见[中文 API](docs/guide/api.md#配置与全屏状态的共同约定)。

Both editors reuse internal options and fullscreen composables without changing their public contracts. Internal options changes emit independent snapshots; identical values do not duplicate events, and equivalent external options preserve local choices. See the [English API](docs/en/guide/api.md#shared-options-and-fullscreen-behavior) for the behavior and implementation notes.
