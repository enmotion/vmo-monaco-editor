# Diff editor & review

State changes do not depend on event listeners or parent writeback. Internal actions update immediately and emit `update:*`; actual prop changes synchronize internal state. Bind with `v-model:*`, or receive `$event` with `@update:*` without writing it back. `viewMode`, `editMode`, `previewSource`, `diffViewMode`, and `fullScreen` each have their own update event; theme, font size, and language are returned together through `update:monacoOptions`.


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

Define the binding variables in the parent: `editMode = 'diff'`, `viewMode = 'edit'`, `previewSource = 'modified'`, `diffViewMode = 'side-by-side'`, empty options objects and `fullScreen = false`. See the [complete toolbar binding example](./toolbar#state-bindings). Preview requires a `preview` slot.

To receive notifications without writing back, use `:edit-mode="editMode" @update:edit-mode="handleMode($event)"`. `edit-mode-change`, `view-mode-change`, and `preview-source-change` independently notify their state changes, alongside `diff-view-mode-change`, `options-change`, `diff-options-change` and `fullscreen-change`. Listen on the editor itself for changes initiated by the default toolbar; UI forwarding is unnecessary.

### `VmoMonacoDiffEditor` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `originalValue` | `string` | `''` | Original/confirmed text. Supports `v-model:original-value`. |
| `modifiedValue` | `string` | `''` | Modified/proposal text. Supports `v-model:modified-value`. |
| `prefix` | `string` | `''` | Extra content above the editor. |
| `suffix` | `string` | `''` | Extra content below the editor. |
| `viewMode` | `'edit' \| 'preview'` | `'edit'` | Independent edit/preview state |
| `editMode` | `'original' \| 'modified' \| 'diff'` | `'diff'` | Independent content selection |
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
| `update:viewMode` / `view-mode-change` | edit / preview | View state changes |
| `update:editMode` / `edit-mode-change` | original / modified / diff | Content selection changes |
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


## Confirming and async review

`needConfirm` delays only update:originalValue/update:modifiedValue content submission. Display mode, source, layout, options and fullscreen state events remain immediate. `bidibind` governs incoming text values only.

Confirmation emits the current original model as `confirmedValue`; it does not automatically accept remaining proposals. Wait for diff calculation, accept desired changes, then confirm. Single-change methods use zero-based indices from the current `getLineChanges()` result. Avoid stale indices while `diffPending` is true.

Additional state includes `currentEditMode`, `currentDiffViewMode`, `lineChanges`, `diffPending`, `computedMonacoEditorOption`, `currentReadOnly`, and `isFullScreen`. `refreshMonacoEditor()` is also available. For `togglePreview()`, `changePreviewSource()`, `hasPreview` and `currentPreviewSource`, see [Previews](./preview).

## Calculation and API boundaries

While `diffPending=true`, an empty `lineChanges` array does not prove equality. Single-block actions use zero-based indexes from the current calculation. Edits invalidate those indexes; stale calculations and invalid indexes make the operation return without a success review event. Recalculate and obtain fresh indexes between successive actions.

Toolbar bulk buttons are disabled during calculation, but the bulk APIs themselves directly copy the entire model without checking `diffPending`. Review methods return `void`; review events are emitted on Vue's next tick. Awaiting a review method does not wait for a new diff calculation.

In diff mode both side getters return editors. In a single-side mode only that side's getter returns an editor; in preview both return null. `getDiffEditor()` only returns the visible diff editor, never the background calculator. Getters can also return null before mounting or during transitions. Reacquire instances after mode changes, which recreate editors.

## Permissions, URIs and lifecycle

`disabled` and side editability flags constrain manual input, not review APIs. `showReviewActions=false` disables native marker click handling only; it neither hides the toolbar nor disables programmatic review. For readonly comparison, disable input, omit review controls and restrict review calls in the host application.

URI props are identities used to construct `inmemory://` URIs, not file-loading URLs. Defaults include the component UID and collisions receive unique suffixes. Changing URI props after mounting does not recreate models; use a Vue `:key` to remount for a new file identity.

View changes and refresh reuse both models, retaining text and model undo history, but cursor, scroll and selection are not guaranteed to persist. Unmount disposes both models and the background calculator. External text synchronization uses `setValue()`, which may reset undo history and overwrite uncommitted drafts even with `needConfirm=true`.


## Slots

| Name | Props | Fallback and rendering condition |
| --- | --- | --- |
| `default` | `{ viewMode: ViewMode }` | Above the editor, typically a toolbar; no content when omitted |
| `prefix` | `{ option: VmoMonacoEditorOption }` | Replaces extra content above the editor; otherwise renders the prefix prop through v-html. Present when the slot exists or prefix is nonempty |
| `suffix` | `{ option: VmoMonacoEditorOption }` | Replaces extra content below the editor; otherwise renders the suffix prop through v-html. Present when the slot exists or suffix is nonempty |
| `preview` | `{ content: string; language: string; source: Source; theme: Theme }` | Rendered only in preview display mode; supplying this slot enables preview, with no built-in content renderer |

`option` contains current options merged with defaults and follows state changes. Prefix/suffix content is outside the Monaco model. These slots do not receive a draft or submission methods. Use Vue interpolation for plain text and trusted content for HTML props.

`content` is the selected source's internal draft, including uncommitted edits. `language` is the current editor language, falling back to plaintext. `source` is original/modified; `theme` is the current editor theme. This replaces the preview content area, not its outer container or source buttons (shown when the proposal is nonempty). Without this slot preview is unavailable; initial preview falls back to edit while preserving editMode, and removing the slot exits preview.

```vue
<VmoMonacoDiffEditor :original-value="original" :modified-value="proposal" style="height: 500px">
  <template #prefix="{ option }"><span>{{ option.language }}</span></template>
  <template #preview="{ content, language, source, theme }">
    <VmoCodePreview :content="content" :language="language" :theme="theme" />
    <span>{{ source }}</span>
  </template>
  <template #suffix="{ option }"><span>{{ option.fontSize }} px</span></template>
</VmoMonacoDiffEditor>
```


## Shared options and fullscreen behavior

The ordinary and diff editors share options and fullscreen state management. Existing public props, events, methods, and slots retain their contracts:

- `resetMonacoEditorOptions()` deeply merges internal options. The diff editor's `resetMonacoDiffEditorOptions()` follows the same rules for diff options. An unchanged result does not emit another options event.
- Options props synchronize actual external changes by top-level field, comparing nested objects as whole fields. Equivalent objects preserve local choices; removing an external field removes the corresponding internal override. External options synchronization does not emit options writeback events.
- Internal options changes update state before emitting `update:monacoOptions` and then `options-change` (or `update:diffOptions` and `diff-options-change` for diff options). Each event receives an independent snapshot: mutating one payload cannot change internal options or the other payload. Snapshots contain internal overrides; read `computedMonacoEditorOption` for effective options merged with defaults.
- `changeFullScreen(value)` and `fullscreenSwitch()` update local state before emitting `update:fullScreen` and `fullscreen-change`. Actual external fullScreen changes use the same synchronization path. Setting the same value, including v-model writeback, does not duplicate events.

Local actions remain effective without parent writeback. `needConfirm` and `bidibind` govern text submission/synchronization only and do not change these rules.
