# Preview components


Three standalone components are exported: `VmoTextPreview`, `VmoCodePreview`, and
`VmoMarkdownPreview`. They can be placed inside a preview slot or used on their own.
`VmoMonacoDiffEditor` provides a `#preview` slot and a `preview` display mode.
When the slot is supplied, the default toolbar includes a standalone plain-text
**Preview** toggle. Click again to return to the previous editing mode. Without the
slot, the button is hidden and preview mode is unavailable. Set UI config
`preview: false` to hide the toggle. In a custom toolbar slot, add
`<vmo-monaco-preview-toggle />` explicitly; it is exported as `VmoMonacoPreviewToggle`
and also supports a direct `monaco` prop and a default slot for custom button content.

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


### Editor Preview Mode

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

Entering preview from Original selects the original draft; entering from Proposal
or Diff selects the proposal. The preview header has plain-text Original/Proposal
buttons for changing source without leaving preview. Set `previewSource` to
override the entry default. Preview does not commit text or replace the two models.
Layout/review actions and diff counts are hidden in preview; the mode switch stays
available. Removing the slot exits preview to Proposal.

The public API includes `togglePreview()`, `changeDisplayMode('preview')`,
`changePreviewSource('original' | 'modified')`, `hasPreview`, and
`currentPreviewSource`. Initial `displayMode="preview"` is also supported when the
slot is present. An initial preview mode without a slot falls back to Proposal.


