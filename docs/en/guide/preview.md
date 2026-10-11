# Preview components

## Independent view and content state

Both editors expose `viewMode: 'edit' | 'preview'` through `v-model:view-mode`, `update:viewMode` and `view-mode-change`. The diff editor additionally exposes `editMode: 'original' | 'modified' | 'diff'` through `v-model:edit-mode`, `update:editMode` and `edit-mode-change`. Changing one never changes the other. `diffViewMode` only selects the comparison layout; `previewSource` only selects the preview draft. Props initialize state and real parent changes synchronize it; without writeback local changes persist.

Both editors provide the same `default`, `prefix`, `preview`, and `suffix` slots. The preview payload is `{ content, language, source, theme }`; the ordinary editor's source is always `original`. Preview requires a preview slot. Removing it returns to `edit` while retaining the diff editor's `editMode`. The ordinary editor preserves its Monaco instance and draft across view changes.

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


See the [complete component API reference](./api) for all props, emits, instance properties and methods.


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




## Preview-related slots

VmoTextPreview, VmoCodePreview and VmoMarkdownPreview have no slots; supplied default or named content is not rendered. Use content for text, render for custom Markdown rendering and monacoOptions for code configuration.

VmoMonacoDiffEditor's preview slot receives `{ content, language, source, theme }` and renders only in preview mode. There is no built-in preview content fallback; supply a preview component or another renderer. Only the content area is replaced, while source controls and the outer container remain. See [diff editor slots](./api#vmomonacodiffeditor) for default/prefix/suffix props.

VmoMonacoPreviewToggle's default slot receives `{ active: boolean }` and replaces only text inside its existing button. The icon, click handling and accessibility attributes remain. It renders only with a preview-capable target; default text is “预览” (preview) / “返回编辑器” (return to editor). Do not nest another button.

```vue
<VmoMonacoPreviewToggle :monaco="diffRef">
  <template #default="{ active }">
    <span>{{ active ? 'Return to editor' : 'Preview' }}</span>
  </template>
</VmoMonacoPreviewToggle>
```
