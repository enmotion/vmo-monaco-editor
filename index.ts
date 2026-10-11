export type { VmoMonacoViewMode, VmoMonacoDiffEditMode } from '@comps/vmo-monaco-diff-editor/types'
import VmoMonacoPreviewToggle from '@comps/vmo-monaco-ui/controls/preview-toggle.vue'
export type { VmoMonacoPreviewControlValue, VmoMonacoPreviewControlConfig } from '@comps/vmo-monaco-ui/controls/preview-toggle.vue'
export type { VmoMonacoPreviewSource } from '@comps/vmo-monaco-diff-editor/types'
import VmoTextPreview from '@comps/vmo-preview/vmo-text-preview.vue'
import VmoCodePreview from '@comps/vmo-preview/vmo-code-preview.vue'
import VmoMarkdownPreview from '@comps/vmo-preview/vmo-markdown-preview.vue'
export type { VmoPreviewTheme, VmoMarkdownRender, VmoCodePreviewOptions } from '@comps/vmo-preview/types'
import VmoMonacoEditor from '@comps/vmo-monaco-editor/vmo-monaco-editor.vue'
import VmoMonacoDiffEditor from '@comps/vmo-monaco-diff-editor/vmo-monaco-diff-editor.vue'
import VmoMonacoUi from '@comps/vmo-monaco-ui/vmo-monaco-ui.vue'
import VmoMonacoCommitButton from '@comps/vmo-monaco-ui/controls/commit-button.vue'
import VmoMonacoFontSizeInput from '@comps/vmo-monaco-ui/controls/font-size-input.vue'
import VmoMonacoFullscreenToggle from '@comps/vmo-monaco-ui/controls/fullscreen-toggle.vue'
import VmoMonacoLanguageSelect from '@comps/vmo-monaco-ui/controls/language-select.vue'
import VmoMonacoLineNumbersToggle from '@comps/vmo-monaco-ui/controls/line-numbers-toggle.vue'
import VmoMonacoMinimapToggle from '@comps/vmo-monaco-ui/controls/minimap-toggle.vue'
import VmoMonacoDiffReview from '@comps/vmo-monaco-ui/controls/diff-review.vue'
import VmoMonacoThemeToggle from '@comps/vmo-monaco-ui/controls/theme-toggle.vue'
import sqlProvider from '@lib/languages/sql'
import pythonProvider from '@lib/languages/python'
import groovyProvider from '@lib/languages/groovy'
import defaultProvider from '@lib/languages/default'
import type {
  VmoMonacoContext,
  VmoMonacoContextMethod,
  VmoMonacoContextObject,
  VmoMonacoEditorExpose,
  VmoMonacoDiffEditorExpose,
  VmoMonacoEditorOption
} from '@type'
import type {
  VmoMonacoDiffChangePayload,
  VmoMonacoDiffConfirmPayload,
  VmoMonacoDiffDisplayMode,
  VmoMonacoDiffReviewActionPayload,
  VmoMonacoDiffViewMode
} from '@comps/vmo-monaco-diff-editor/vmo-monaco-diff-editor.vue'
import type { VmoMonacoCommitControlConfig, VmoMonacoCommitControlValue } from '@comps/vmo-monaco-ui/controls/commit-button.vue'
import type {
  VmoMonacoFontSizeControlConfig,
  VmoMonacoFontSizeControlValue
} from '@comps/vmo-monaco-ui/controls/font-size-input.vue'
import type {
  VmoMonacoFullScreenControlConfig,
  VmoMonacoFullScreenControlValue
} from '@comps/vmo-monaco-ui/controls/fullscreen-toggle.vue'
import type {
  VmoMonacoLanguageControlConfig,
  VmoMonacoLanguageControlValue
} from '@comps/vmo-monaco-ui/controls/language-select.vue'
import type {
  VmoMonacoLineNumbersControlConfig,
  VmoMonacoLineNumbersControlValue
} from '@comps/vmo-monaco-ui/controls/line-numbers-toggle.vue'
import type {
  VmoMonacoMinimapControlConfig,
  VmoMonacoMinimapControlValue
} from '@comps/vmo-monaco-ui/controls/minimap-toggle.vue'
import type {
  VmoMonacoDiffReviewControlConfig,
  VmoMonacoDiffReviewControlValue
} from '@comps/vmo-monaco-ui/controls/diff-review.vue'
import type {
  VmoMonacoThemeControlConfig,
  VmoMonacoThemeControlValue
} from '@comps/vmo-monaco-ui/controls/theme-toggle.vue'
import type {
  VmoMonacoControlCommitPayload,
  VmoMonacoControlTarget,
  VmoMonacoControlTargetRef
} from '@comps/vmo-monaco-ui/controls/use-monaco-control'
// import './assets/iconfont/iconfont.css'

const _providers = {
  sql: sqlProvider,
  python: pythonProvider,
  groovy: groovyProvider,
  defaultProvider: defaultProvider
}
function useReminderPlugin(language?: 'sql' | 'python' | 'groovy') {
  return language ? _providers[language] : _providers['defaultProvider']
}
// import { initMonacoEnvironment } from '@lib/monaco-editor-inti'
export {
  VmoMonacoPreviewToggle,
  VmoTextPreview,
  VmoCodePreview,
  VmoMarkdownPreview,
  VmoMonacoContext,
  VmoMonacoContextMethod,
  VmoMonacoContextObject,
  VmoMonacoEditorExpose,
  VmoMonacoDiffEditorExpose,
  VmoMonacoEditorOption,
  VmoMonacoDiffChangePayload,
  VmoMonacoDiffConfirmPayload,
  VmoMonacoDiffDisplayMode,
  VmoMonacoDiffReviewActionPayload,
  VmoMonacoDiffViewMode,
  VmoMonacoCommitControlConfig,
  VmoMonacoCommitControlValue,
  VmoMonacoFontSizeControlConfig,
  VmoMonacoFontSizeControlValue,
  VmoMonacoFullScreenControlConfig,
  VmoMonacoFullScreenControlValue,
  VmoMonacoLanguageControlConfig,
  VmoMonacoLanguageControlValue,
  VmoMonacoLineNumbersControlConfig,
  VmoMonacoLineNumbersControlValue,
  VmoMonacoMinimapControlConfig,
  VmoMonacoMinimapControlValue,
  VmoMonacoDiffReviewControlConfig,
  VmoMonacoDiffReviewControlValue,
  VmoMonacoThemeControlConfig,
  VmoMonacoThemeControlValue,
  VmoMonacoControlCommitPayload,
  VmoMonacoControlTarget,
  VmoMonacoControlTargetRef,
  VmoMonacoEditor,
  VmoMonacoDiffEditor,
  VmoMonacoUi,
  VmoMonacoCommitButton,
  VmoMonacoFontSizeInput,
  VmoMonacoFullscreenToggle,
  VmoMonacoLanguageSelect,
  VmoMonacoLineNumbersToggle,
  VmoMonacoMinimapToggle,
  VmoMonacoDiffReview,
  VmoMonacoThemeToggle,
  useReminderPlugin
}
