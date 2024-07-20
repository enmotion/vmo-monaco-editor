import VmoMonacoEditor from '@comps/vmo-monaco-editor/vmo-monaco-editor.vue'
import VmoMonacoUi from '@comps/vmo-monaco-ui/vmo-monaco-ui.vue'
import { sqlReminderRegisterCompletionItemProvider } from '@lib/languages/sql'
import { pythonReminderRegisterCompletionItemProvider } from '@lib/languages/python'
import type { MonacoExtraContent } from '@type'
// import { initMonacoEnvironment } from '@lib/monaco-editor-inti'
export {
  MonacoExtraContent,
  VmoMonacoEditor,
  VmoMonacoUi,
  sqlReminderRegisterCompletionItemProvider,
  pythonReminderRegisterCompletionItemProvider
}
