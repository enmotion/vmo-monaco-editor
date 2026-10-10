# Diff editor & review

See the [complete component API reference](./api) for all props, emits, instance properties and methods.


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
    style="height: 500px">
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
| `displayMode` | `'original' \| 'modified' \| 'diff' \| 'preview'` | `'diff'` | Show original, modified, diff, or the supplied preview slot. |
| `previewSource` | `'original' \| 'modified'` | Unset | Override the source selected when entering preview; supports external updates. |
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
| `preview-source-change` | `'original' \| 'modified'` | Preview source changed. |
| `mode-change` | `'original' \| 'modified' \| 'diff' \| 'preview'` | Display mode changed. |

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


## Confirming and async review

Confirmation emits the current original model as `confirmedValue`; it does not automatically accept remaining proposals. Wait for diff calculation, accept desired changes, then confirm. Single-change methods use zero-based indices from the current `getLineChanges()` result. Avoid stale indices while `diffPending` is true.

Additional state includes `currentDisplayMode`, `currentDiffViewMode`, `lineChanges`, `diffPending`, `computedMonacoEditorOption`, and `isFullScreen`. `refreshMonacoEditor()` is also available. For `togglePreview()`, `changePreviewSource()`, `hasPreview` and `currentPreviewSource`, see [Previews](./preview).

## Calculation and API boundaries

While `diffPending=true`, an empty `lineChanges` array does not prove equality. Single-block actions use zero-based indexes from the current calculation. Edits invalidate those indexes; stale calculations and invalid indexes make the operation return without a success review event. Recalculate and obtain fresh indexes between successive actions.

Toolbar bulk buttons are disabled during calculation, but the bulk APIs themselves directly copy the entire model without checking `diffPending`. Review methods return `void`; review events are emitted on Vue's next tick. Awaiting a review method does not wait for a new diff calculation.

In diff mode both side getters return editors. In a single-side mode only that side's getter returns an editor; in preview both return null. `getDiffEditor()` only returns the visible diff editor, never the background calculator. Getters can also return null before mounting or during transitions. Reacquire instances after mode changes, which recreate editors.

## Permissions, URIs and lifecycle

`disabled` and side editability flags constrain manual input, not review APIs. `showReviewActions=false` disables native marker click handling only; it neither hides the toolbar nor disables programmatic review. For readonly comparison, disable input, omit review controls and restrict review calls in the host application.

URI props are identities used to construct `inmemory://` URIs, not file-loading URLs. Defaults include the component UID and collisions receive unique suffixes. Changing URI props after mounting does not recreate models; use a Vue `:key` to remount for a new file identity.

View changes and refresh reuse both models, retaining text and model undo history, but cursor, scroll and selection are not guaranteed to persist. Unmount disposes both models and the background calculator. External text synchronization uses `setValue()`, which may reset undo history and overwrite uncommitted drafts even with `needConfirm=true`.
