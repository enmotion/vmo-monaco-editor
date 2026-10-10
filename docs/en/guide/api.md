# Complete component API reference

[简体中文](../../guide/api)

This reference covers all 15 components exported by the current source. All props are optional and can use kebab-case in templates. Component refs are `null` before mounting. Reactive state is automatically unwrapped on component instances. Methods return `void` unless stated otherwise.

These components do not restrict instance access with `expose()`: props and members returned by `setup()` are accessible through refs. All returned members are listed below. Internal helpers are documented for clarity; use public methods to change state. Vue built-ins such as `$el` and `$props` are not library-specific APIs.

Type aliases: `Option` = `VmoMonacoEditorOption`, `Target` = `VmoMonacoControlTarget`, `Pair` = `{ originalValue: string; modifiedValue: string }`, `Mode` = `original | modified | diff | preview`, `ViewMode` = `side-by-side | inline`, `Source` = `original | modified`, `Theme` = `vs-dark | vs-light`. All enum values are strings.

## VmoMonacoEditor

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `'//code content gose here...'` | Editable content supporting `v-model` |
| `prefix` | `string` | `'(()=>{})'` | Content above the editor, outside the model |
| `suffix` | `string` | `'};'` | Content below the editor, outside the model |
| `needConfirm` | `boolean` | `false` | Delay content submission |
| `bidibind` | `boolean` | `true` | Synchronize external content changes |
| `disabled` | `boolean` | `false` | Set Monaco to readonly |
| `zIndex` | `number` | `99` | Fullscreen container z-index |
| `monacoOptions` | `VmoMonacoEditorOption` | `{}` | Monaco option overrides |
| `remindConfig` | `{ language?: 'sql' \| 'python' \| 'groovy'; extra: Partial<VmoMonacoContext> }[]` | `[]` | Custom completion configuration |

Monaco defaults are `automaticLayout: true`, `theme: 'vs-dark'`, `language: 'typescript'`, `lineNumbers: 'on'`, `fontSize: 12`, and `minimap: { enabled: true }`. Supplied options are deeply merged with these defaults.

### Emits

| `Event` | Payload | When emitted |
| --- | --- | --- |
| `update:modelValue` | `string` | Immediate edits when needConfirm=false, or `commit()` |
| `change` | `string` | Blur when needConfirm=false, or `commit()` |
| `focuse` | None | Editor focus; the event is spelled `focuse` |
| `blur` | None | Editor blur |

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `computedMonacoEditorOption` | Option | Current options after merging defaults and internal options |
| `isFullScreen` | boolean | Current fullscreen state; initially false |
| `innerValue` | string | Internal draft, including uncommitted edits |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `insertCodeString(codeString: string)` | Insert at the cursor without replacing the selection; no action without a cursor |
| `resetMonacoEditorOptions(options: Option)` | Deeply merge options; watchers apply them to Monaco |
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

## VmoMonacoDiffEditor

In immediate mode, each side emits its own `update:*` on content changes, and blur emits `change`. Review actions emit review events on the next Vue tick and, when confirmation is not required, submit both values and `change`. `confirm()` / `commit()` submit current content immediately without waiting for diff calculation. Focus events in the two-pane diff view are bound to the proposal side; single-model views bind the visible side.

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `originalValue` | `string` | `''` | `v-model:original-value` |
| `modifiedValue` | `string` | `''` | `v-model:modified-value` |
| `prefix` / `suffix` | `string` | `''` | Content displayed outside the models |
| `displayMode` | `'original' \| 'modified' \| 'diff' \| 'preview'` | `'diff'` | Display mode |
| `previewSource` | `'original' \| 'modified'` | Unset | Override the preview source |
| `diffViewMode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | Diff layout |
| `editableOriginal` | `boolean` | `false` | Allow original edits |
| `editableModified` | `boolean` | `true` | Allow proposal edits |
| `needConfirm` | `boolean` | `false` | Require explicit submission |
| `bidibind` | `boolean` | `true` | Synchronize external values |
| `disabled` | `boolean` | `false` | Readonly editor views |
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
| `update:originalValue` | `string` | Original update/submission |
| `update:modifiedValue` | `string` | Proposal update/submission |
| `change` | `pair` | Current contents of both models |
| `accept-change` / `reject-change` | `pair & { index?: number; lineChange?: ILineChange }` | Single diff block accepted/rejected |
| `accept-all` / `reject-all` | `pair` | All changes accepted/rejected |
| `confirm` | `pair & { confirmedValue: string }` | Confirm the current original text |
| `mode-change` | Display mode string | Display mode changed |
| `preview-source-change` | `'original' \| 'modified'` | Preview source changed |
| `focuse` / `blur` | None | Focus/blur; retains the `focuse` spelling |

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `computedMonacoEditorOption` | Option | Current options after merging defaults and internal options |
| `isFullScreen` | boolean | Current fullscreen state; initially false |
| `currentDisplayMode` | Mode | Actual mode, which may fall back when no preview slot exists |
| `currentDiffViewMode` | ViewMode | Current side-by-side/inline layout |
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
| `fullscreenSwitch()` | Toggle this component container’s fullscreen state |
| `changeLanguage(language: string)` | Update the model language and internal options |
| `refreshMonacoEditor()` | Recreate the editor; see the guide for model retention behavior |
| `commit()` | Submit internal values; the normal editor emits update:modelValue and change; the diff editor delegates to confirm |
| `resetMonacoDiffEditorOptions(options: Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>)` | Deeply merge diff options; layout and edit permissions remain controlled by dedicated props/state |
| `changeDisplayMode(mode: Mode)` | Switch views; preview requires a slot; emit mode-change on an actual change |
| `changeDiffViewMode(mode: ViewMode)` | Switch diff layout; no editor-level layout event is emitted |
| `changePreviewSource(source: Source)` | Switch preview source; emit preview-source-change on an actual change |
| `togglePreview()` | Enter preview or return to the previous editing mode; no entry without a slot |
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

### Emits and instance methods

No custom emits or returned instance methods. The UI does not forward child control events automatically. To listen to those events, place controls in a custom default slot.

### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `theme` | Theme | First target theme, falling back to vs-light |
| `monacoNeedConfirm` | boolean | Whether any target requires confirmation |
| `languageVisible` | boolean | More than one language and not explicitly hidden |
| `languageControlConfig` | `{ languages?: string[] } / undefined` | Resolved language config |
| `fontSizeControlConfig` | `{ min?: number; max?: number; step?: number } / undefined` | Resolved font size config |
| `themeControlConfig` | Theme / undefined | Resolved theme config |
| `lineNumbersControlConfig` | on / off / undefined | Resolved line number config |
| `reviewActionsControlConfig` | boolean | Whether the review control is enabled |


## Shared standalone control conventions

### Shared props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `monaco` | Target | null | Explicit targets take priority; null falls back to toolbar injection |
| `value` | Control-specific value type | undefined | External display value supporting v-model:value; does not automatically set target state |
| `config` | Control-specific config type | undefined | Dedicated config; see each control |

Every control below includes these three props. The shared `commit` notification payload is `{ type: string; value?: TValue; config?: TConfig; monacoCount: number }`. Except for the commit button, emitting this event does not submit editor content.

## VmoMonacoCommitButton

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | unknown | undefined | Shared controlled value |
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


## VmoMonacoFontSizeInput

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | number | undefined | Shared controlled value |
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
| `currentValue` | number | First truthy value among value, modelValue, first target fontSize, and 12; zero falls back |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `handleInput(event: Event)` | Convert event.target.value to Number, update all target font sizes, then emit both update events and commit; min/max are input attributes and the method does not clamp values |


## VmoMonacoLanguageSelect

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | undefined | Shared controlled value |
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
| `currentValue` | string | First truthy value among value, modelValue, first target language, and an empty string |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `handleChange(event: Event)` | Read event.target.value, call changeLanguage on all targets, then emit both update events, change and commit |


## VmoMonacoThemeToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | Theme | undefined | Shared controlled value |
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
| `currentTheme` | Theme | value → theme → first target theme → config → vs-light |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleTheme()` | Toggle vs-dark/vs-light, update all targets, and emit update:value, toggle and commit |


## VmoMonacoFullscreenToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | boolean | undefined | Shared controlled value |
| `config` | boolean | undefined | Control configuration |
| `monaco` | Target | null | Shared target |
| `isFullScreen` | boolean | undefined | Compatibility state; false can still fall back to target state |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | boolean | After toggling |
| `toggle` | boolean | Same value as update:value |
| `commit` | Shared notification, type=fullScreen | After value events |


### Instance properties

| `Property` | Type | Description |
| --- | --- | --- |
| `currentValue` | boolean | Boolean value → boolean config → isFullScreen or first target state |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleFullScreen()` | Toggle only the first target; no action or events without a target; emit update:value, toggle and commit |


## VmoMonacoLineNumbersToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | on / off | undefined | Shared controlled value |
| `config` | on / off | undefined | Control configuration |
| `monaco` | Target | null | Shared target |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | on / off | After toggling |
| `toggle` | on / off | Same value as update:value |
| `commit` | Shared notification, type=lineNumbers | After value events |


### Instance properties

No additional returned state properties; props remain readable.

### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleLineNumbers()` | Toggle based on value → config → first target lineNumbers → on; update all targets and emit the three events; currentValue is not returned on the instance |


## VmoMonacoMinimapToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | boolean | undefined | Shared controlled value |
| `config` | boolean | undefined | Control configuration |
| `monaco` | Target | null | Shared target |


### Emits

| `Event` | Payload | Timing |
| --- | --- | --- |
| `update:value` | boolean | After toggling |
| `toggle` | boolean | Same value as update:value |
| `commit` | Shared notification, type=minimap | After value events |


### Instance properties

No additional returned state properties; props remain readable.

### Instance methods

| `Signature` | Description |
| --- | --- |
| `toggleMinimap()` | Current state uses boolean value → boolean config → first target minimap.enabled; update all targets and emit the three events; currentValue is not returned |


## VmoMonacoPreviewToggle

### Props

| `Property` | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | boolean | undefined | Shared controlled value |
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
| `previewMonacos` | VmoMonacoDiffEditorExpose[] | Targets with a preview slot and preview methods |
| `currentValue` | boolean | Boolean value takes priority; otherwise check whether the first valid target is in preview |


### Instance methods

| `Signature` | Description |
| --- | --- |
| `togglePreview()` | Enter/exit preview for all valid targets; no action or events without valid targets; config is included in notifications only and does not determine visibility or state |


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
| `currentDiffViewMode` | ViewMode | First target’s layout, falling back to side-by-side |


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
| `changeDiffViewMode(mode: ViewMode)` | Synchronize diff layout |

These methods do not check `canReview`; custom menus should disable unavailable actions. `closePanel` and target lists are not returned on the instance. The default slot supplies `lineChanges`, `diffPending`, `currentDisplayMode`, `hasPreview`, and the review/mode methods above (excluding `togglePanel`). The UI’s `review-actions` slot forwards the same parameters.

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
