# Toolbar & controls

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

If `monaco` is an array, option controls apply to all targets; fullscreen switches only the first target, and preview/review controls filter for compatible targets. For `commit`, targets are committed in reverse order so the first item is treated as the primary editor and commits last.

## State bindings

Current values, active icons and hover hints indicate state. The default slot fully replaces the toolbar controls; editor props and events remain the state binding interface.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoDiffEditor, VmoMonacoUi, VmoTextPreview } from 'vmo-monaco-editor'
import type { VmoMonacoDiffEditMode, VmoMonacoViewMode, VmoMonacoDiffViewMode, VmoMonacoPreviewSource, VmoMonacoEditorOption } from 'vmo-monaco-editor'
import type { editor as MonacoEditor } from 'monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const diffRef = ref()
const original = ref('Original text')
const proposal = ref('Proposed text')
const editMode = ref<VmoMonacoDiffEditMode>('diff')
const viewMode = ref<VmoMonacoViewMode>('edit')
const previewSource = ref<VmoMonacoPreviewSource>('modified')
const diffViewMode = ref<VmoMonacoDiffViewMode>('side-by-side')
const editorOptions = ref<VmoMonacoEditorOption>({ theme: 'vs-light', language: 'plaintext', fontSize: 14 })
const diffOptions = ref<Partial<MonacoEditor.IStandaloneDiffEditorConstructionOptions>>({ ignoreTrimWhitespace: true })
const fullScreen = ref(false)
</script>

<template>
  <VmoMonacoDiffEditor ref="diffRef"
    v-model:original-value="original" v-model:modified-value="proposal"
    v-model:edit-mode="editMode" v-model:view-mode="viewMode"
    v-model:preview-source="previewSource"
    v-model:diff-view-mode="diffViewMode"
    v-model:monaco-options="editorOptions"
    v-model:diff-options="diffOptions"
    v-model:full-screen="fullScreen" style="height: 500px">
    <VmoMonacoUi :monaco="diffRef" :config="{ theme: true, fontSize: true, fullScreen: true, reviewActions: true }" />
    <template #preview="{ content, theme }">
      <VmoTextPreview :content="content" :theme="theme" />
    </template>
  </VmoMonacoDiffEditor>
</template>
```

Preview requires a `preview` slot. Theme, font size, language, line numbers and minimap are fields of `editorOptions`. The normal editor supports `v-model:monaco-options` and `v-model:full-screen` too. Props initialize internal state; internal actions update immediately and emit `update:*`. Actual external changes override local state, while equivalent option objects preserve it. Standalone controls support `v-model:value`; font size and language also support `v-model`. Toolbar `config` controls visibility and control configuration; it is not the editor state binding interface. For notification-only usage, use `:edit-mode="editMode" @update:edit-mode="handleMode($event)"`. Listen on the editor for `update:*` state events; UI does not forward individual control interaction events.

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


## Language selection

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

## Control events

| Controls | Events |
| --- | --- |
| Theme, fullscreen, minimap, line numbers, preview | `update:value`, `toggle`, `commit` |
| Font size | `update:value`, `update:modelValue`, `commit` |
| Language | `update:value`, `update:modelValue`, `change`, `commit` |
| Commit button | `commit` |
| Diff review | `accept-all`, `reject-all`, `confirm`, `accept-change`, `reject-change`, `edit-mode-change`, `diff-view-mode-change` |

An explicit `config` replaces the default config object. Editors with `needConfirm=true` automatically show the commit control.

## Controlled values and event meaning

Standalone controls also accept `value` and support `v-model:value`; font size and language additionally emit `update:modelValue`. An explicit value initializes local state and synchronizes when it actually changes. Internal actions remain effective even when the parent does not write emitted values back. Toolbar config chooses visible controls; put initial editor theme, font size and other options in `monacoOptions`.

Ordinary control `commit` events report an interaction with `{ type, value?, config?, monacoCount }`. They do not report saved code or automatically call the editor's `commit()`. The commit button calls target editors’ `commit()` methods before emitting the same interaction payload. Diff review control events report interactions with type, value, config, monacoCount, index, lineChanges and an optional mode; they differ from diff editor content events.

For multiple targets, displayed option values usually come from the first target while option actions apply to all targets (fullscreen uses only the first); they do not summarize mixed states. Null array entries are filtered. An explicit non-null `monaco` takes priority over toolbar injection; null falls back to the injected target.


## Toolbar and control slots

| Component | Slot | Props and purpose |
| --- | --- | --- |
| VmoMonacoUi | default | `{ viewMode }`; replaces all default controls, preserving injected editor context |
| VmoMonacoUi | review-actions | All props below; replaces built-in review menu; requires default toolbar and config.reviewActions |
| VmoMonacoDiffReview | default | All props below; replaces this control's review menu |
| VmoMonacoPreviewToggle | default | `{ active: boolean }`; customizes button content, not the outer button or click behavior |
| Commit, font size, language, theme, fullscreen, line number, minimap controls | None | No slot outlets; supplied slot content is not rendered |

Both review slots render only while the menu is open, retaining the trigger, popover and outside-click closing behavior. With a custom UI default slot, review-actions is not forwarded to manually inserted review controls; use VmoMonacoDiffReview's default slot instead.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `lineChanges` | `Monaco.editor.ILineChange[]` | Current diff blocks from the first diff target; avoid stale indexes during calculation |
| `diffPending` | `boolean` | Whether the latest diff is still calculating |
| `currentEditMode` | `EditMode` | Current display mode |
| `currentViewMode` | `ViewMode` | Current edit/preview state, independent of editMode |
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

```vue
<VmoMonacoPreviewToggle :monaco="diffRef">
  <template #default="{ active }">
    <span>{{ active ? 'Return to editor' : 'Preview' }}</span>
  </template>
</VmoMonacoPreviewToggle>
```

The editors’ toolbar (`default`) slots and `VmoMonacoUi`’s default slot receive `{ viewMode }`, the effective internal edit/preview state. UI reads its first target, falling back to edit when no target is available. Parent writeback is not required.

```vue
<VmoMonacoUi :monaco="editorRef">
  <template #default="{ viewMode }">
    <VmoMonacoFontSizeInput v-show="viewMode === 'edit'" />
    <VmoMonacoPreviewToggle />
  </template>
</VmoMonacoUi>
```
