import VmoMonacoEditor from '@comps/vmo-monaco-editor/vmo-monaco-editor.vue'
import VmoMonacoUi from '@comps/vmo-monaco-ui/vmo-monaco-ui.vue'
import sqlProvider from '@lib/languages/sql'
import pythonProvider from '@lib/languages/python'
import groovyProvider from '@lib/languages/groovy'
import defaultProvider from '@lib/languages/default'
import type { MonacoExtraContent } from '@type'

const _providers = {
  sql: sqlProvider,
  python: pythonProvider,
  groovy: groovyProvider,
  defaultProvider: defaultProvider
}
function useReminder(language?: 'sql' | 'python' | 'groovy') {
  return language ? _providers[language] : _providers['defaultProvider']
}
// import { initMonacoEnvironment } from '@lib/monaco-editor-inti'
export { MonacoExtraContent, VmoMonacoEditor, VmoMonacoUi, useReminder }
