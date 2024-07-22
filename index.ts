import VmoMonacoEditor from '@comps/vmo-monaco-editor/vmo-monaco-editor.vue'
import VmoMonacoUi from '@comps/vmo-monaco-ui/vmo-monaco-ui.vue'
import sqlProvider from '@lib/languages/sql'
import pythonProvider from '@lib/languages/python'
import groovyProvider from '@lib/languages/groovy'
import defaultProvider from '@lib/languages/default'
import type { VmoMonacoContext, VmoMonacoContextMethod, VmoMonacoContextObject } from '@type'
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
  VmoMonacoEditor,
  VmoMonacoUi,
  useReminderPlugin
}
