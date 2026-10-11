# Complete component API reference

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


[简体中文](../../guide/api)

This reference covers all 15 components exported by the current source. All props are optional and can use kebab-case in templates. Component refs are `null` before mounting. Reactive state is automatically unwrapped on component instances. Methods return `void` unless stated otherwise.

These components do not restrict instance access with `expose()`: props and members returned by `setup()` are accessible through refs. All returned members are listed below. Internal helpers are documented for clarity; use public methods to change state. Vue built-ins such as `$el` and `$props` are not library-specific APIs.

Type aliases: `Option` = `VmoMonacoEditorOption`, `Target` = `VmoMonacoControlTarget`, `Pair` = `{ originalValue: string; modifiedValue: string }`, `Mode` = `original | modified | diff | preview`, `LayoutMode` = `side-by-side | inline`, `ViewMode` = `edit | preview`, `EditMode` = `original | modified | diff`, `Source` = `original | modified`, `Theme` = `vs-dark | vs-light`. All enum values are strings.

## VmoMonacoEditor

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `viewMode` | `'edit' \| 'preview'` | `'edit'` | Independent editor/preview state; supports `v-model:view-mode` |
| `modelValue` | `string` | `'//code content gose here...'` | Editable content supporting `v-model` |
| `prefix` | `string` | `'(()=>{})'` | Content above the editor, outside the model |
| `suffix` | `string` | `'};'` | Content below the editor, outside the model |
| `needConfirm` | `boolean` | `false` | Delay content submission |
| `bidibind` | `boolean` | `true` | Synchronize external content changes |
| `disabled` | `boolean` | `false` | Set Monaco to readonly |
| `fullScreen` | `boolean` | `false` | Fullscreen state, supports `v-model:full-screen` |
| `zIndex` | `number` | `99` | Fullscreen container z-index |
| `monacoOptions` | `VmoMonacoEditorOption` | `{}` | Monaco option overrides |
| `remindConfig` | `{ language?: 'sql' \| 'python' \| 'groovy'; extra: Partial<VmoMonacoContext> }[]` | `[]` | Custom completion configuration |

State props initialize local state and synchronize on actual external changes. Internal actions take effect immediately and emit `update:*` without requiring parent writeback. Equivalent option objects preserve internal settings.

Monaco defaults are `automaticLayout: true`, `theme: 'vs-dark'`, `language: 'typescript'`, `lineNumbers: 'on'`, `fontSize: 12`, and `minimap: { enabled: true }`. Supplied options are deeply merged with these defaults.

### Emits

| `Event` | Payload | When emitted |
| --- | --- | --- |
| `update:viewMode` / `view-mode-change` | ViewMode | View state actually changes |
| `update:modelValue` | `string` | Immediate edits when needConfirm=false, or `commit()` |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | Controls or API change internal options; returns an independent snapshot |
| `update:fullScreen` / `fullscreen-change` | `boolean` | Fullscreen state actually changes |
| `change` | `string` | Blur when needConfirm=false, or `commit()` |
| `focuse` | None | Editor focus; the event is spelled `focuse` |
| `blur` | None | Editor blur |

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `currentViewMode` | ViewMode | Current independent view state |
| `computedMonacoEditorOption` | Option | Current options after merging defaults and internal options |
| `currentReadOnly` | boolean | Current readonly state from disabled and monacoOptions.readOnly |
| `isFullScreen` | boolean | Current fullscreen state, initialized from fullScreen |
| `innerValue` | string | Internal draft, including uncommitted edits |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `changeViewMode(mode: ViewMode)` | Changes view only; preview requires its slot |
| `togglePreview()` | Toggles edit/preview, preserving the Monaco instance and draft |
| `insertCodeString(codeString: string)` | Insert at the cursor without replacing the selection; no action without a cursor |
| `resetMonacoEditorOptions(options: Option)` | Deeply merge options; watchers apply them to Monaco |
| `changeFullScreen(value: boolean)` | Set fullscreen state and emit an update when it changes |
| `fullscreenSwitch()` | Toggle this component container’s fullscreen state |
| `changeLanguage(language: string)` | Update the model language and internal options |
| `refreshMonacoEditor()` | Recreate the editor; see the guide for model retention behavior |
| `commit()` | Submit internal values; the normal editor emits update:modelValue and change; the diff editor delegates to confirm |


### Other accessible members

| `Member` | Type | Description |
| --- | --- | --- |
| `context` | SetupContext | Vue slots, attrs and emit context; internal helper |
| `MonacoEditorRef` | HTMLElement / null | Monaco mounting DOM element; internal helper |
| `monacoEditorOptions` | Option | Internal option overrides; change through resetMonacoEditorOptions |
| `mergeDeepRight(a, b)` | Function | Ramda deep-merge helper returning the merged result; not an editor action API |


See [Normal editor](./editor).


### Slots

| Name | Props | Fallback and rendering condition |
| --- | --- | --- |
| `default` | None | Above the editor, typically a toolbar; no content when omitted |
| `prefix` | `{ option: VmoMonacoEditorOption }` | Replaces extra content above the editor; otherwise renders the prefix prop through v-html. Present when the slot exists or prefix is nonempty |
| `suffix` | `{ option: VmoMonacoEditorOption }` | Replaces extra content below the editor; otherwise renders the suffix prop through v-html. Present when the slot exists or suffix is nonempty |
| `preview` | `{ content: string; language: string; source: 'original'; theme: Theme }` | Current draft; only renders in preview mode; no built-in renderer. |

`option` contains current options merged with defaults and follows state changes. Prefix/suffix content is outside the Monaco model. These slots do not receive a draft or submission methods. Use Vue interpolation for plain text and trusted content for HTML props.

```vue
<VmoMonacoEditor ref="editorRef" v-model="code" style="height: 400px">
  <template #default><VmoMonacoUi :monaco="editorRef" /></template>
  <template #prefix="{ option }"><span>{{ option.language }}</span></template>
  <template #suffix="{ option }"><span>{{ option.fontSize }} px</span></template>
</VmoMonacoEditor>
```

## VmoMonacoDiffEditor

In immediate mode, each side emits update:originalValue or update:modifiedValue on content changes, and blur emits `change`. Review actions emit review events on the next Vue tick and, when confirmation is not required, submit both values and `change`. `confirm()` / `commit()` submit current content immediately without waiting for diff calculation. Focus events in the two-pane diff view are bound to the proposal side; single-model views bind the visible side.

`needConfirm` delays only update:originalValue/update:modifiedValue content submission. Mode, preview source, layout, options and fullscreen update:* events remain immediate. `bidibind` affects external text synchronization only. External option props synchronize without emitting option writeback events; internal controls/API changes emit option snapshots.

 | `currentEditMode` | EditMode | Current content selection |
### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `viewMode` | `'edit' \| 'preview'` | `'edit'` | Independent editor/preview state; supports `v-model:view-mode` |
| `originalValue` | `string` | `''` | `v-model:original-value` |
| `modifiedValue` | `string` | `''` | `v-model:modified-value` |
| `prefix` / `suffix` | `string` | `''` | Content displayed outside the models |
| `editMode` | `'original' \| 'modified' \| 'diff'` | `'diff'` | Independent content selection; supports `v-model:edit-mode` |
| `displayMode` | `'original' \| 'modified' \| 'diff' \| 'preview'` | `'diff'` | Deprecated compatibility mode; explicit new props take priority |
| `previewSource` | `'original' \| 'modified'` | Unset | Override the preview source |
| `diffViewMode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | Diff layout |
| `editableOriginal` | `boolean` | `false` | Allow original edits |
| `editableModified` | `boolean` | `true` | Allow proposal edits |
| `needConfirm` | `boolean` | `false` | Require explicit submission |
| `bidibind` | `boolean` | `true` | Synchronize external values |
| `disabled` | `boolean` | `false` | Readonly editor views |
| `fullScreen` | `boolean` | `false` | Fullscreen state, supports `v-model:full-screen` |
| `zIndex` | `number` | `99` | Fullscreen z-index |
| `originalUri` | `string` | `'vmo-monaco-diff-original'` | Original model URI identity |
| `modifiedUri` | `string` | `'vmo-monaco-diff-modified'` | Proposal model URI identity |
| `monacoOptions` | `VmoMonacoEditorOption` | `{}` | Shared editor options |
| `diffOptions` | `Partial<IStandaloneDiffEditorConstructionOptions>` | `{}` | Diff options |
| `showReviewActions` | `boolean` | `true` | Enable native `+/-` review click handling |

### Emits

Here, `pair` means `{ originalValue: string; modifiedValue: string }`.

| `Event` | Payload | Description |
| --- | --- | --- |
| `update:viewMode` / `view-mode-change` | ViewMode | View state actually changes |
| `update:editMode` / `edit-mode-change` | EditMode | Content selection actually changes, including during preview |
| `update:displayMode` / `mode-change` | Display mode string | Display mode actually changes |
| `update:previewSource` / `preview-source-change` | `'original' \| 'modified'` | Preview source actually changes |
| `update:diffViewMode` / `diff-view-mode-change` | `'side-by-side' \| 'inline'` | Diff layout actually changes |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | Controls or API change shared options |
| `update:diffOptions` / `diff-options-change` | Diff options object | API changes diff options |
| `update:fullScreen` / `fullscreen-change` | `boolean` | Fullscreen state actually changes |
| `update:originalValue` | `string` | Original update/submission |
| `update:modifiedValue` | `string` | Proposal update/submission |
| `change` | `pair` | Current contents of both models |
| `accept-change` / `reject-change` | `pair & { index?: number; lineChange?: ILineChange }` | Single diff block accepted/rejected |
| `accept-all` / `reject-all` | `pair` | All changes accepted/rejected |
| `confirm` | `pair & { confirmedValue: string }` | Confirm the current original text |
| `focuse` / `blur` | None | Focus/blur; retains the `focuse` spelling |

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `currentViewMode` | ViewMode | Current independent view state |
| `computedMonacoEditorOption` | Option | Current options after merging defaults and internal options |
| `isFullScreen` | boolean | Current fullscreen state, initialized from fullScreen |
| `currentReadOnly` | boolean | Whether the current view is readonly |
| `currentDisplayMode` | Mode | Actual mode, which may fall back when no preview slot exists |
| `currentDiffViewMode` | LayoutMode | Current side-by-side/inline layout |
| `hasPreview` | boolean | Whether a preview slot exists |
| `currentPreviewSource` | Source | Current preview source |
| `modifiedInnerValue` | string | Internal proposal draft; originalInnerValue is not returned and cannot be accessed directly |
| `previewContent` | string | Internal draft for the selected source |
| `previewLanguage` | string | Configured language, falling back to plaintext |
| `lineChanges` | Monaco.editor.ILineChange[] | Latest valid diff blocks; not a final result during calculation |
| `diffPending` | boolean | Whether the latest comparison is pending; initially true |
| `showReviewActions` | boolean | Initial prop snapshot returned from setup |
| `needConfirm` | boolean | Initial prop snapshot returned from setup; behavior still reads reactive props |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `resetMonacoEditorOptions(options: Option)` | Deeply merge options; watchers apply them to Monaco |
| `changeFullScreen(value: boolean)` | Set fullscreen state and emit an update when it changes |
| `fullscreenSwitch()` | Toggle this component container’s fullscreen state |
| `changeLanguage(language: string)` | Update the model language and internal options |
| `refreshMonacoEditor()` | Recreate the editor; see the guide for model retention behavior |
| `commit()` | Submit internal values; the normal editor emits update:modelValue and change; the diff editor delegates to confirm |
| `resetMonacoDiffEditorOptions(options: Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>)` | Deeply merge diff options; layout and edit permissions remain controlled by dedicated props/state |
| `changeViewMode(mode: ViewMode)` | Changes view only; preview requires its slot |
| `changeEditMode(mode: EditMode)` | Changes content selection without leaving preview |
| `togglePreview()` | Enter preview or return to the previous editing mode; no entry without a slot |
| `changeDisplayMode(mode: Mode)` | Switch views; preview requires a slot; emit update:displayMode and mode-change on an actual change |
| `changeDiffViewMode(mode: LayoutMode)` | Switch diff layout; no editor-level layout event is emitted |
| `changePreviewSource(source: Source)` | Switch preview source; emit update:previewSource and preview-source-change on an actual change |
| `acceptChange(index: number)` | Accept the current diff block by zero-based index; no action for invalid results |
| `rejectChange(index: number)` | Reject the current diff block by zero-based index; no action for invalid results |
| `acceptAllChanges()` | Copy the entire modified model to original without checking diffPending |
| `rejectAllChanges()` | Copy the entire original model to modified without checking diffPending |
| `confirm()` | Emit both update events, change, then confirm; confirmedValue is the original text |
| `getLineChanges(): Monaco.editor.ILineChange[]` | Read current valid diff blocks without waiting for calculation |
| `getOriginalEditor(): Monaco.editor.IStandaloneCodeEditor / null` | Get the visible original editor |
| `getModifiedEditor(): Monaco.editor.IStandaloneCodeEditor / null` | Get the visible proposal editor |
| `getDiffEditor(): Monaco.editor.IStandaloneDiffEditor / null` | Get the visible diff editor; the background instance is not returned |


### Other accessible members

| `Member` | Type | Description |
| --- | --- | --- |
| `context` | SetupContext | Vue slots, attrs and emit context; internal helper |
| `MonacoEditorRef` | HTMLElement / null | Monaco mounting DOM element; internal helper |
| `monacoEditorOptions` | Option | Internal option overrides; change through resetMonacoEditorOptions |
| `mergeDeepRight(a, b)` | Function | Ramda deep-merge helper returning the merged result; not an editor action API |


See [Diff editor and review](./diff-editor).


### Slots

| Name | Props | Fallback and rendering condition |
| --- | --- | --- |
| `default` | None | Above the editor, typically a toolbar; no content when omitted |
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

## VmoMonacoUi

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | VMO:Editor | Title |
| `monaco` | Target | null | Editor targets provided to child controls |
| `config` | `Partial<MonacoUIConfig>` | See below | Replace the default config object without merging |

`MonacoUIConfig` is exported by the component source, not the package root. Infer its configuration type from the component props.

Default config:

```ts
{ fontSize: true, theme: true, minimap: true, lineNumbers: true, fullScreen: true,
  languages: ['css', 'html', 'json', 'javascript', 'typescript'] }
```

| `Key` | Type | Description |
| --- | --- | --- |
| `theme` | `boolean \| 'vs-dark' \| 'vs-light'` | Theme toggle |
| `fontSize` | `boolean \| { min?: number; max?: number; step?: number }` | Font size input |
| `minimap` | `boolean` | Minimap toggle |
| `lineNumbers` | `boolean \| 'on' \| 'off'` | Line number toggle |
| `fullScreen` | `boolean` | Fullscreen toggle |
| `commit` | `boolean` | Commit button |
| `preview` | `boolean` | Preview toggle |
| `reviewActions` | `boolean` | Diff review popover; requires a diff target |
| `language` | `boolean \| { languages?: string[] }` | Language selector config |
| `languages` | `string[]` | Shortcut language list |

The toolbar shows the language selector only when more than one language is configured. `language: false` explicitly hides it. A current language outside the list appears as a disabled option. Equivalent inline option rerenders preserve toolbar selections; actual external language changes still synchronize.

The persistent status row shows content, interaction mode, current language, font size in px, theme and pending confirmation. Hidden setting controls do not hide current settings; a custom default slot preserves this row. UI `config.fullScreen` controls button visibility; the editor `fullScreen` prop is the bindable state.

### Emits and instance methods

No custom emits. The UI does not forward child control interaction events; listen on controls in a custom default slot. Editor state updates are emitted by the editor itself. `changeContentMode(mode)` accepts original, modified or diff and applies to all diff targets: content actions only change editMode, preserving viewMode and previewSource.

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `monacos` | Target[] | Current editor target array |
| `editorOption` | Option | Current first-target options |
| `diffMonacos` | VmoMonacoDiffEditorExpose[] | Diff targets supporting display mode changes |
| `contentModes` | Mode descriptor array | Values and labels for original/proposal/diff |
| `currentContentMode` | original / modified / diff | Current editMode, independent of previewSource |
| `isPreview` | boolean | Whether currently previewing |
| `diffViewLabel` | string | Side-by-side/inline label |
| `interactionLabel` | string | Edit/readonly/preview label |
| `theme` | Theme | First target theme, falling back to vs-light |
| `monacoNeedConfirm` | boolean | Whether any target requires confirmation |
| `languageVisible` | boolean | More than one language and not explicitly hidden |
| `languageControlConfig` | `{ languages?: string[] } / undefined` | Resolved language config |
| `fontSizeControlConfig` | `{ min?: number; max?: number; step?: number } / undefined` | Resolved font size config |
| `themeControlConfig` | Theme / undefined | Resolved theme config |
| `lineNumbersControlConfig` | on / off / undefined | Resolved line number config |
| `reviewActionsControlConfig` | boolean | Whether the review control is enabled |



### Slots

| Name | Props | Fallback and rendering condition |
| --- | --- | --- |
| `default` | None | Replaces upper title/default controls; the lower status row and provided editor context remain |
| `review-actions` | All props listed below | Replaces the default review control's popover content; requires the default toolbar, truthy config.reviewActions and an open review menu |

With a custom default slot the built-in review control is not created, so review-actions is not automatically forwarded to a manually inserted VmoMonacoDiffReview. Use that control's own default slot. Fallback content is the default toolbar and built-in review buttons. review-actions replaces neither the trigger icon nor the popover container.

| Parameter | Type | Meaning |
| --- | --- | --- |
| `lineChanges` | `Monaco.editor.ILineChange[]` | Current diff blocks from the first diff target; avoid stale indexes during calculation |
| `diffPending` | `boolean` | Whether the latest diff is still calculating |
| `currentDisplayMode` | `Mode` | Current display mode |
| `hasPreview` | `boolean` | Whether the first diff target provides a preview slot |
| `acceptChange` | `(index: number) => void` | Accept a block from the current diff array |
| `rejectChange` | `(index: number) => void` | Reject a block from the current diff array |
| `acceptAllChanges` | `() => void` | Accept all changes |
| `rejectAllChanges` | `() => void` | Reject all changes |
| `changeDisplayMode` | `(mode: Mode) => void` | Switch display mode; preview applies only to preview-capable targets |
| `changeDiffViewMode` | `(mode: LayoutMode) => void` | Switch side-by-side/inline layout |
| `confirm` | `() => void` | Confirm the current content |

Destructure camelCase names even though template bindings use kebab-case. The slot does not supply `canReview`, `currentDiffViewMode` or `closePanel`. Disable bulk buttons using `diffPending || !lineChanges.length`; the methods themselves do not enforce this condition.

## Shared standalone control conventions

### Shared props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `monaco` | Target | null | Explicit targets take priority; null falls back to toolbar injection |
| `value` | Control-specific value type | undefined | External initial/update value supporting v-model:value; setting controls apply it to targets, while commit/review controls use it as event metadata |
| `config` | Control-specific config type | undefined | Dedicated config; see each control |

Every control below includes these three props. The shared `commit` notification payload is `{ type: string; value?: TValue; config?: TConfig; monacoCount: number }`. Except for the commit button, emitting this event does not submit editor content.

Setting controls initialize from value (font size/language also support modelValue). Internal actions immediately update local state and emit update:value, retaining that state without parent writeback. Actual changes to the effective external value synchronize the control and target; editor API changes also update the control. External synchronization does not emit control toggle/change/commit interaction events, but invoking editor APIs can emit the editor's own option/mode events. Removing the external value (undefined) falls back to the current target value or default. Commit/review value props are event metadata only.

## VmoMonacoCommitButton

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | unknown | undefined | External initial/update value |
| `config` | boolean | undefined | Control configuration |
| `monaco` | Target | null | Shared target |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `commit` | Shared notification, type=commit | After target commit calls |


### Instance properties

No additional returned state properties; props remain readable.

### Instance methods

| `Signature` | Description |
| --- | --- |
| `handleCommit()` | Call all targets’ commit in reverse order, then emit commit; type=commit |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

## VmoMonacoFontSizeInput

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | number | undefined | External initial/update value |
| `config` | `{ min?: number; max?: number; step?: number }` | undefined | Control configuration |
| `monaco` | Target | null | Shared target |
| `modelValue` | number | undefined | v-model compatibility value; lower priority than value |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | number | After input/selection |
| `update:modelValue` | number | In the same interaction, for v-model compatibility |
| `commit` | Shared notification, type=fontSize | After the value events above |


### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `inputConfig` | `{ min: number; max: number; step: number }` | Merged with defaults min=6, max=100, step=1 |
| `currentValue` | number | Local font size, initialized from value, modelValue, first target fontSize, then 12. Actual external changes and editor API updates synchronize it; explicit zero is not treated as absent |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `handleInput(event: Event)` | Convert event.target.value to Number, update all target font sizes, then emit both update events and commit; min/max are input attributes and the method does not clamp values |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

## VmoMonacoLanguageSelect

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | undefined | External initial/update value |
| `config` | `{ languages?: string[] }` | undefined | Control configuration |
| `monaco` | Target | null | Shared target |
| `modelValue` | string | undefined | v-model compatibility value |
| `languages` | string[] | [] | Used when config.languages is unset |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | string | After input/selection |
| `update:modelValue` | string | In the same interaction, for v-model compatibility |
| `change` | string | After language selection |
| `commit` | Shared notification, type=language | After the value events above |


### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `currentLanguages` | string[] | config.languages takes priority over languages |
| `currentValue` | string | Local language, initialized from value, modelValue, first target language, then an empty string. Actual external changes and editor API updates synchronize it |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `handleChange(event: Event)` | Read event.target.value, call changeLanguage on all targets, then emit both update events, change and commit |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

## VmoMonacoThemeToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Theme | undefined | External initial/update value |
| `config` | Theme | undefined | Control configuration |
| `monaco` | Target | null | Shared target |
| `theme` | Theme | undefined | Compatibility theme value; lower priority than value |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | Theme | After toggling |
| `toggle` | Theme | Same value as update:value |
| `commit` | Shared notification, type=theme | After value events |


### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `currentTheme` | Theme | Current local theme, initialized from value → theme → config → first target theme → vs-light |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleTheme()` | Toggle vs-dark/vs-light, update all targets, and emit update:value, toggle and commit |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

## VmoMonacoFullscreenToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | boolean | undefined | External initial/update value |
| `config` | boolean | undefined | Control configuration |
| `monaco` | Target | null | Shared target |
| `isFullScreen` | boolean | undefined | Compatibility initial/update value; false explicitly exits fullscreen |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | boolean | After toggling |
| `toggle` | boolean | Same value as update:value |
| `commit` | Shared notification, type=fullScreen | After value events |


### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `currentValue` | boolean | Current local state, initialized from value → config → isFullScreen → first target state |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleFullScreen()` | Toggle only the first target; no action or events without a target; emit update:value, toggle and commit |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

## VmoMonacoLineNumbersToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | on / off | undefined | External initial/update value |
| `config` | on / off | undefined | Control configuration |
| `monaco` | Target | null | Shared target |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | on / off | After toggling |
| `toggle` | on / off | Same value as update:value |
| `commit` | Shared notification, type=lineNumbers | After value events |


### Instance properties

`currentValue` exposes local state, synchronized with actual external changes and editor API updates.

### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleLineNumbers()` | Toggle local state, update all targets and emit update:value, toggle and commit; currentValue is readable |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

## VmoMonacoMinimapToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | boolean | undefined | External initial/update value |
| `config` | boolean | undefined | Control configuration |
| `monaco` | Target | null | Shared target |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | boolean | After toggling |
| `toggle` | boolean | Same value as update:value |
| `commit` | Shared notification, type=minimap | After value events |


### Instance properties

`currentValue` exposes local state, synchronized with actual external changes and editor API updates.

### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleMinimap()` | Toggle local state, update all targets and emit update:value, toggle and commit; currentValue is readable |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

## VmoMonacoPreviewToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | boolean | undefined | External initial/update value |
| `config` | boolean | undefined | Control configuration |
| `monaco` | Target | null | Shared target |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | boolean | After toggling |
| `toggle` | boolean | Same value as update:value |
| `commit` | Shared notification, type=preview | After value events |


### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `previewMonacos` | VmoMonacoEditorExpose[] | Targets with a preview slot and preview methods |
| `currentValue` | boolean | Local preview state initialized from value, synchronized with actual external changes and target state |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `togglePreview()` | Enter/exit preview for all valid targets; no action or events without valid targets; config is included in notifications only and does not determine visibility or state |



### Slots

| Name | Props | Fallback and rendering condition |
| --- | --- | --- |
| `default` | `{ active: boolean }` | Replaces text inside the button, rendered only with a preview-capable target. Fallback is “预览” (preview) or “返回编辑器” (return to editor) |

active is the current local preview state, not the next action. The outer button, icon, click handling, title, aria-label and aria-pressed remain. This does not replace the whole button; do not nest another button inside it.

```vue
<VmoMonacoPreviewToggle :monaco="diffRef">
  <template #default="{ active }">
    <span>{{ active ? 'Return to editor' : 'Preview' }}</span>
  </template>
</VmoMonacoPreviewToggle>
```

## VmoMonacoDiffReview

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `monaco` | Target | null | Filter targets supporting diff review methods |
| `value` | unknown | undefined | Included in control event payloads only; does not determine review state |
| `config` | boolean | undefined | Included in payloads only; does not control standalone control visibility |


### Emits

These are **control interaction notifications**, distinct from diff editor content events. Notifications are emitted synchronously after calling targets, even if a target ignores an action because its diff is stale. Listen to the diff editor’s own `confirm` event for submitted content.

```ts
type ReviewControlPayload = {
  type: string
  value: unknown
  config: boolean | undefined
  monacoCount: number // Number of valid diff targets
  index: number | undefined
  lineChanges: Monaco.editor.ILineChange[] // First target’s current results; recalculation may be pending
  mode?: VmoMonacoDiffDisplayMode | VmoMonacoDiffViewMode
}
```

### Event list

| `Event` | Payload and description |
| --- | --- |
| `accept-all` | ReviewControlPayload; Call accept all |
| `reject-all` | ReviewControlPayload; Call reject all |
| `confirm` | ReviewControlPayload; Call confirm on all targets |
| `accept-change` | ReviewControlPayload; index is the supplied zero-based index |
| `reject-change` | ReviewControlPayload; index is the supplied zero-based index |
| `display-mode-change` | ReviewControlPayload; mode is the display mode; preview applies only to targets with slots |
| `diff-view-mode-change` | ReviewControlPayload; mode is the diff layout |


### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `ReviewActionsRef` | HTMLElement / null | Menu root DOM used internally for outside-click handling |
| `isOpen` | boolean | Whether the menu is open; initially false |
| `lineChanges` | Monaco.editor.ILineChange[] | First diff target’s blocks, falling back to [] |
| `diffPending` | boolean | First target’s pending state, falling back to false |
| `canReview` | boolean | Not pending and has differences; used by default bulk buttons |
| `currentDisplayMode` | Mode | First target’s mode, falling back to diff |
| `hasPreview` | boolean | First target’s preview availability, falling back to false |
| `currentDiffViewMode` | LayoutMode | First target’s layout, falling back to side-by-side |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `togglePanel()` | Toggle the popover and document click listener; no events |
| `acceptChange(index: number)` | Call single-block accept on all valid targets, then emit a control notification |
| `rejectChange(index: number)` | Call single-block reject on all valid targets, then emit a control notification |
| `acceptAllChanges()` | Call accept all on every valid target |
| `rejectAllChanges()` | Call reject all on every valid target |
| `confirm()` | Confirm every valid target |
| `changeDisplayMode(mode: Mode)` | Synchronize display mode |
| `changeDiffViewMode(mode: LayoutMode)` | Synchronize diff layout |

These methods do not check `canReview`; custom menus should disable unavailable actions. `closePanel` and target lists are not returned on the instance. The default slot supplies `lineChanges`, `diffPending`, `currentDisplayMode`, `hasPreview`, and the review/mode methods above (excluding `togglePanel`). The UI’s `review-actions` slot forwards the same parameters.


### Slots

| Name | Props | Fallback and rendering condition |
| --- | --- | --- |
| `default` | All props listed below | Replaces review popover content, rendered only while open. The trigger, popover shell and outside-click closing behavior remain; fallback is the built-in mode/layout/count/accept/reject controls |

| Parameter | Type | Meaning |
| --- | --- | --- |
| `lineChanges` | `Monaco.editor.ILineChange[]` | Current diff blocks from the first diff target; avoid stale indexes during calculation |
| `diffPending` | `boolean` | Whether the latest diff is still calculating |
| `currentDisplayMode` | `Mode` | Current display mode |
| `hasPreview` | `boolean` | Whether the first diff target provides a preview slot |
| `acceptChange` | `(index: number) => void` | Accept a block from the current diff array |
| `rejectChange` | `(index: number) => void` | Reject a block from the current diff array |
| `acceptAllChanges` | `() => void` | Accept all changes |
| `rejectAllChanges` | `() => void` | Reject all changes |
| `changeDisplayMode` | `(mode: Mode) => void` | Switch display mode; preview applies only to preview-capable targets |
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

## VmoTextPreview

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | string | '' | Reactive content to display |
| `theme` | Theme | vs-light | Preview theme |
| `unstyled` | boolean | false | Remove default typography while preserving newlines |


### Emits and instance methods

No custom emits or returned instance methods.

### Instance properties

No additional returned state properties.


### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

Preview content uses the content prop; custom Markdown rendering uses render; code options use monacoOptions.

## VmoCodePreview

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | string | '' | Reactive content to display |
| `theme` | Theme | vs-light | Preview theme |
| `language` | string | plaintext | Model language |
| `monacoOptions` | VmoCodePreviewOptions | `{}` | Optional Monaco settings; content, model, language, theme and readonly state are managed by the component |


### Emits and instance methods

No custom emits or returned instance methods.

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `container` | HTMLElement / null | Preview mounting DOM; internal editor and model are not exposed |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

Preview content uses the content prop; custom Markdown rendering uses render; code options use monacoOptions.

## VmoMarkdownPreview

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | string | '' | Reactive content to display |
| `theme` | Theme | vs-light | Preview theme |
| `unstyled` | boolean | false | Remove default typography |
| `render` | (content: string) =&gt; string | undefined | Synchronously return trusted HTML; use built-in markdown-it when omitted |


### Emits and instance methods

No custom emits or returned instance methods.

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `renderedContent` | string | Current rendered HTML, including custom renderer output |



### Slots

No slots. Supplied default or named slot content is not rendered; customize through this component’s props, events and API.

Preview content uses the content prop; custom Markdown rendering uses render; code options use monacoOptions.

## Using component refs

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoFontSizeInput } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'
const code = ref('SELECT * FROM users')
const editorRef = ref<InstanceType<typeof VmoMonacoEditor> | null>(null)
const sizeRef = ref<InstanceType<typeof VmoMonacoFontSizeInput> | null>(null)
const fontSize = ref(14)
</script>

<template>
  <VmoMonacoEditor ref="editorRef" v-model="code" prefix="" suffix=""
    :need-confirm="true" :monaco-options="{ language: 'sql' }"
    style="height: 400px" @change="value => console.log(value)" />
  <VmoMonacoFontSizeInput ref="sizeRef" :monaco="editorRef" v-model="fontSize"
    :config="{ min: 10, max: 32, step: 1 }" />
  <button @click="editorRef?.commit()">Submit draft</button>
</template>
```

`VmoMonacoEditorExpose` / `VmoMonacoDiffEditorExpose` are interface subsets used by toolbar targets, not exhaustive runtime instance definitions. Use `InstanceType` as above for the full instance. The diff editor’s returned `needConfirm` / `showReviewActions` values are initial snapshots; read current props through `$props`. Changing an instance field does not update the parent’s prop.
