# Toolbar & controls

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
  <template #review-actions="{ lineChanges, acceptAllChanges, rejectAllChanges, changeDisplayMode }">
    <button @click="changeDisplayMode('diff')">Diff</button>
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
| Diff review | `accept-all`, `reject-all`, `confirm`, `accept-change`, `reject-change`, `display-mode-change`, `diff-view-mode-change` |

An explicit `config` replaces the default config object. Editors with `needConfirm=true` automatically show the commit control.

## Controlled values and event meaning

Standalone controls also accept `value` and support `v-model:value`; font size and language additionally emit `update:modelValue`. An explicit value takes priority over editor-derived state, so handle updates to keep the displayed state current. Toolbar config chooses visible controls; put initial editor theme, font size and other options in `monacoOptions`.

Ordinary control `commit` events report an interaction with `{ type, value?, config?, monacoCount }`. They do not report saved code or automatically call the editor's `commit()`. The commit button calls target editors’ `commit()` methods before emitting the same interaction payload. Diff review control events report interactions with type, value, config, monacoCount, index, lineChanges and an optional mode; they differ from diff editor content events.

For multiple targets, displayed option values usually come from the first target while option actions apply to all targets (fullscreen uses only the first); they do not summarize mixed states. Null array entries are filtered. An explicit non-null `monaco` takes priority over toolbar injection; null falls back to the injected target.
