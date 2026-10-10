# Normal editor

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


## Defaults and slots

Shared Monaco defaults are `automaticLayout: true`, `theme: "vs-dark"`, `language: "typescript"`, `lineNumbers: "on"`, `fontSize: 12`, and `minimap: { enabled: true }`. Options are deeply merged. The default slot hosts a toolbar; `prefix` and `suffix` slots receive `{ option }`. String prefix/suffix values render through `v-html`; use trusted HTML or slots with Vue interpolation for plain text.

`bidibind=false` disables synchronization of external model changes into the editor. `commit()` emits values; persistence is handled by the host app. The runtime also exposes `innerValue` and `insertCodeString()`, which are not listed in `VmoMonacoEditorExpose`; use the Vue component instance type if you need these members.

## External updates, readonly state and refresh

`needConfirm` delays outgoing submission but does not protect drafts from incoming updates. With `bidibind=true`, a different external `modelValue` replaces the draft, including uncommitted edits. Decide whether to save or discard before switching files or reloading data.

`bidibind=false` still uses the initial value. Re-enabling it does not immediately replay ignored changes: change the external value again or remount. For the normal editor, `disabled` overrides `monacoOptions.readOnly`. Readonly constrains user input; programmatic edits can still change content.

`resetMonacoEditorOptions()` deeply merges options. External options synchronize changed top-level fields; removing a field removes its internal override, restoring the default where available. Nested objects synchronize as entire fields. Equivalent rerenders preserve toolbar choices.

`refreshMonacoEditor()` recreates the editor and its default owned model while retaining draft text. Undo history, selection and cursor are not guaranteed to survive. Prefer option APIs for configuration changes. Layout changes trigger `editor.action.formatDocument`; a registered formatter can therefore modify text during resizing.

Use `ref<InstanceType<typeof VmoMonacoEditor> | null>(null)` for the complete component instance. Refs are null before mounting. `insertCodeString()` inserts at the cursor without replacing the selection and does nothing without a valid position. `innerValue` contains the uncommitted draft. Unmount releases owned editor/model/provider resources; caller-supplied `monacoOptions.model` remains the caller's responsibility.
