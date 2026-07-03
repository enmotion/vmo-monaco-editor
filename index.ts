import VmoMonacoEditor from '@comps/vmo-monaco-editor/vmo-monaco-editor.vue'
import VmoMonacoDiffEditor from '@comps/vmo-monaco-diff-editor/vmo-monaco-diff-editor.vue'
import VmoMonacoUi from '@comps/vmo-monaco-ui/vmo-monaco-ui.vue'
import VmoMonacoCommitButton from '@comps/vmo-monaco-ui/controls/commit-button.vue'
import VmoMonacoFontSizeInput from '@comps/vmo-monaco-ui/controls/font-size-input.vue'
import VmoMonacoFullscreenToggle from '@comps/vmo-monaco-ui/controls/fullscreen-toggle.vue'
import VmoMonacoLanguageSelect from '@comps/vmo-monaco-ui/controls/language-select.vue'
import VmoMonacoLineNumbersToggle from '@comps/vmo-monaco-ui/controls/line-numbers-toggle.vue'
import VmoMonacoMinimapToggle from '@comps/vmo-monaco-ui/controls/minimap-toggle.vue'
import VmoMonacoReviewActions from '@comps/vmo-monaco-ui/controls/review-actions.vue'
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
  VmoMonacoReviewActionsControlConfig,
  VmoMonacoReviewActionsControlValue
} from '@comps/vmo-monaco-ui/controls/review-actions.vue'
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
  VmoMonacoReviewActionsControlConfig,
  VmoMonacoReviewActionsControlValue,
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
  VmoMonacoReviewActions,
  VmoMonacoThemeToggle,
  useReminderPlugin
}
