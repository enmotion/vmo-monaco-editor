import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import * as Ramda from 'ramda'

function harness(initialProps = {}) {
  const editors = [], providers = []
  const Monaco = {
    editor: {
      setTheme() {}, setModelLanguage(model, language) { model.language = language },
      create(_, options) {
        const model = options.model || { language: options.language, disposed: false, getLanguageId() { return this.language }, dispose() { this.disposed = true } }
        const editor = {
          model, options, disposed: false, getModel: () => model,
          dispose() { this.disposed = true }, updateOptions(options) { this.options = options },
          onDidLayoutChange() {}, onDidChangeModelContent() {}, onDidFocusEditorText() {}, onDidBlurEditorText() {}
        }
        editors.push(editor)
        return editor
      }
    },
    languages: { registerCompletionItemProvider(language, provider) {
      const entry = { language, provider, disposed: false, dispose() { this.disposed = true } }
      providers.push(entry)
      return entry
    } }
  }
  const source = fs.readFileSync(new URL('../components/vmo-monaco-editor/vmo-monaco-editor.vue', import.meta.url), 'utf8').match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]
  const context = { exports: {}, require(name) {
    if (name === 'vue') return Vue
    if (name === 'ramda') return Ramda
    if (name.startsWith('monaco-editor')) return Monaco
    if (name === './config') return { vmoMonacoEditorDefaultOption: { language: 'typescript', theme: 'vs-dark' } }
    if (name === '../../index') return { useReminderPlugin: () => () => ({ provideCompletionItems: () => ({ suggestions: ['local'] }) }) }
    throw new Error(name)
  } }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const component = context.exports.default
  component.render = () => null
  const renderer = Vue.createRenderer({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, parentNode: () => null,
    nextSibling: () => null, patchProp() {}
  })
  const props = Vue.reactive(initialProps), editorRef = Vue.ref()
  const app = renderer.createApp({ render: () => Vue.h(component, { ...props, ref: editorRef }) })
  app.mount({})
  return { app, props, editorRef, editors, providers }
}

test('refresh rebinds completion; unmount disposes models and pending registration', async () => {
  const h = harness({ remindConfig: [{ extra: {} }] })
  await Vue.nextTick()
  assert.equal(h.providers.length, 1)
  assert.equal(h.providers[0].language, 'typescript')
  assert.deepEqual(h.providers[0].provider.provideCompletionItems(h.editors[0].model).suggestions, ['local'])
  assert.equal(h.providers[0].provider.provideCompletionItems({}).suggestions.length, 0)
  h.editorRef.value.refreshMonacoEditor()
  await Vue.nextTick()
  assert.equal(h.editors[0].disposed, true)
  assert.equal(h.editors[0].model.disposed, true)
  assert.equal(h.providers[0].disposed, true)
  assert.equal(h.providers.length, 2)
  h.editorRef.value.refreshMonacoEditor()
  h.app.unmount()
  await Vue.nextTick()
  assert.equal(h.providers.length, 2)
  assert.ok(h.editors.every(editor => editor.disposed && editor.model.disposed))
  assert.ok(h.providers.every(provider => provider.disposed))
})
test('callback options survive and nested prop updates reach Monaco', async () => {
  const lineNumbers = line => `L${line}`
  const h = harness({ monacoOptions: { lineNumbers, minimap: { enabled: true } } })
  await Vue.nextTick()
  assert.equal(h.editors[0].options.lineNumbers, lineNumbers)
  h.props.monacoOptions.minimap.enabled = false
  await Vue.nextTick()
  assert.equal(h.editors[0].options.minimap.enabled, false)
  assert.equal(h.editors[0].options.lineNumbers(3), 'L3')
  h.app.unmount()
})
test('caller-owned models are retained on unmount', async () => {
  const model = { dispose() { throw new Error('external model disposed') } }
  const h = harness({ monacoOptions: { model } })
  await Vue.nextTick()
  h.app.unmount()
  assert.equal(h.editors[0].disposed, true)
})
