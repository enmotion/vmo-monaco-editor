# Normal editor

## Independent view and content state

Both editors expose `viewMode: 'edit' | 'preview'` through `v-model:view-mode`, `update:viewMode` and `view-mode-change`. The diff editor additionally exposes `editMode: 'original' | 'modified' | 'diff'` through `v-model:edit-mode`, `update:editMode` and `edit-mode-change`. Changing one never changes the other. `diffViewMode` only selects the comparison layout; `previewSource` only selects the preview draft. Props initialize state and real parent changes synchronize it; without writeback local changes persist.

Both editors provide the same `default`, `prefix`, `preview`, and `suffix` slots. The preview payload is `{ content, language, source, theme }`; the ordinary editor's source is always `original`. Preview requires a preview slot. Removing it returns to `edit` while retaining the diff editor's `editMode`. The ordinary editor preserves its Monaco instance and draft across view changes.

`displayMode`, `currentDisplayMode`, and `changeDisplayMode` are deprecated compatibility interfaces on the diff editor. The current value is a derived projection: preview when viewMode is preview, otherwise editMode. Explicit new props take priority for their own dimension. New integrations should bind the separate states.

```vue
<VmoMonacoEditor v-model="body" v-model:view-mode="viewMode">
  <template #preview="{ content, language, source, theme }">
    <VmoPlainTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoEditor>
<VmoMonacoDiffEditor
  v-model:original-value="body" v-model:modified-value="proposal"
  v-model:view-mode="viewMode" v-model:edit-mode="editMode">
  <template #preview="{ content, language, source, theme }">
    <VmoPlainTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoDiffEditor>
```


See the [complete component API reference](./api) for all props, emits, instance properties and methods.


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

Props initialize local state. Internal actions take effect immediately and emit updates even if the parent does not write them back. Only actual external changes override local state; equivalent option objects preserve toolbar choices. Options synchronize by top-level field, with nested objects treated as entire fields. Removing an external field removes its internal override. `needConfirm` and `bidibind` govern text submission/synchronization only; they do not delay or block option or fullscreen updates.

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


## Defaults and slots

Shared Monaco defaults are `automaticLayout: true`, `theme: "vs-dark"`, `language: "typescript"`, `lineNumbers: "on"`, `fontSize: 12`, and `minimap: { enabled: true }`. Options are deeply merged. The default slot hosts a toolbar; `prefix` and `suffix` slots receive `{ option }`. String prefix/suffix values render through `v-html`; use trusted HTML or slots with Vue interpolation for plain text.

`bidibind=false` disables synchronization of external model changes into the editor. `commit()` emits values; persistence is handled by the host app. The runtime also exposes `innerValue` and `insertCodeString()`, which are not listed in `VmoMonacoEditorExpose`; use the Vue component instance type if you need these members.

## External updates, readonly state and refresh

`needConfirm` delays outgoing submission but does not protect drafts from incoming updates. With `bidibind=true`, a different external `modelValue` replaces the draft, including uncommitted edits. Decide whether to save or discard before switching files or reloading data.

`bidibind=false` still uses the initial value. Re-enabling it does not immediately replay ignored changes: change the external value again or remount. For the normal editor, readonly state is `disabled || monacoOptions.readOnly`, exposed as `currentReadOnly`. Setting `disabled=false` does not override `monacoOptions.readOnly=true`. Readonly constrains user input; programmatic edits can still change content.

`resetMonacoEditorOptions()` deeply merges options. External options synchronize changed top-level fields; removing a field removes its internal override, restoring the default where available. Nested objects synchronize as entire fields. Equivalent rerenders preserve toolbar choices.

`refreshMonacoEditor()` recreates the editor and its default owned model while retaining draft text. Undo history, selection and cursor are not guaranteed to survive. Prefer option APIs for configuration changes. Layout changes trigger `editor.action.formatDocument`; a registered formatter can therefore modify text during resizing.

Use `ref<InstanceType<typeof VmoMonacoEditor> | null>(null)` for the complete component instance. Refs are null before mounting. `insertCodeString()` inserts at the cursor without replacing the selection and does nothing without a valid position. `innerValue` contains the uncommitted draft. Unmount releases owned editor/model/provider resources; caller-supplied `monacoOptions.model` remains the caller's responsibility.


## Slots

| Name | Props | Fallback and rendering condition |
| --- | --- | --- |
| `default` | None | Above the editor, typically a toolbar; no content when omitted |
| `prefix` | `{ option: VmoMonacoEditorOption }` | Replaces extra content above the editor; otherwise renders the prefix prop through v-html. Present when the slot exists or prefix is nonempty |
| `suffix` | `{ option: VmoMonacoEditorOption }` | Replaces extra content below the editor; otherwise renders the suffix prop through v-html. Present when the slot exists or suffix is nonempty |

`option` contains current options merged with defaults and follows state changes. Prefix/suffix content is outside the Monaco model. These slots do not receive a draft or submission methods. Use Vue interpolation for plain text and trusted content for HTML props.

```vue
<VmoMonacoEditor ref="editorRef" v-model="code" style="height: 400px">
  <template #default><VmoMonacoUi :monaco="editorRef" /></template>
  <template #prefix="{ option }"><span>{{ option.language }}</span></template>
  <template #suffix="{ option }"><span>{{ option.fontSize }} px</span></template>
</VmoMonacoEditor>
```
