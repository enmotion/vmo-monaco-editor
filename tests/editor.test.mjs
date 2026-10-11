import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transpileModule, runInNewContext } from './helpers/source-runtime.mjs'
import ts from 'typescript'
import * as Vue from 'vue'
import * as Ramda from 'ramda'

function harness(initialProps = {}, behavior = {}) {
  const editors = [], providers = [], events = [], mounted = [], beforeUpdate = []
  const Monaco = {
    Range: class { constructor(sl, sc, el, ec) { Object.assign(this, { sl, sc, el, ec }) } },
    editor: {
      setTheme() {}, setModelLanguage(model, language) { model.language = language },
      create(_, options) {
        const model = options.model || { language: options.language, disposed: false, getLanguageId() { return this.language }, dispose() { this.disposed = true } }
        const editor = {
          value: options.value, handlers: {}, position: { lineNumber: 1, column: 2 }, triggers: [],
          model, options, disposed: false, getModel: () => model,
          getValue() { return this.value },
          setValue(value) { this.value = value; this.handlers.content?.() },
          getPosition() { return this.position },
          executeEdits(_, edits) { this.setValue(this.value.slice(0, 1) + edits[0].text + this.value.slice(1)) },
          trigger(...args) { this.triggers.push(args) },
          dispose() { this.disposed = true }, updateOptions(options) { this.options = options },
          onDidLayoutChange(fn) { this.handlers.layout = fn }, onDidChangeModelContent(fn) { this.handlers.content = fn },
          onDidFocusEditorText(fn) { this.handlers.focus = fn }, onDidBlurEditorText(fn) { this.handlers.blur = fn }
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
    if (name === 'vue') return { ...Vue, onBeforeUpdate: fn => beforeUpdate.push(fn), ...(behavior.deferMount ? { onMounted: fn => mounted.push(fn) } : {}) }
    if (name === 'ramda') return Ramda
    if (name.endsWith('/sync-monaco-options')) {
      const helper = { exports: {}, require: () => Ramda }
      runInNewContext(transpileModule(fs.readFileSync(new URL('../use.lib/sync-monaco-options.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, helper)
      return helper.exports
    }
    if (name.startsWith('monaco-editor')) return Monaco
    if (name === './config') return { vmoMonacoEditorDefaultOption: { language: 'typescript', theme: 'vs-dark' } }
    if (name === '../../index') return { useReminderPlugin: () => () => ({ provideCompletionItems: () => ({ suggestions: ['local'] }) }) }
    throw new Error(name)
  } }
  runInNewContext(transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const component = context.exports.default
  component.render = () => null
  const renderer = Vue.createRenderer({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, parentNode: () => null,
    nextSibling: () => null, patchProp() {}
  })
  const props = Vue.reactive(initialProps), editorRef = Vue.ref()
  const app = renderer.createApp({ render: () => Vue.h(component, { ...props, ref: editorRef,
    'onUpdate:viewMode': value => { events.push(['update:viewMode', value]); if (behavior.bindState) props.viewMode = value },
    onViewModeChange: value => events.push(['view-mode-change', value]),
    'onUpdate:modelValue': value => events.push(['update:modelValue', value]),
    'onUpdate:monacoOptions': value => { events.push(['update:monacoOptions', value]); if (behavior.bindState) props.monacoOptions = value },
    onOptionsChange: value => events.push(['options-change', value]),
    'onUpdate:fullScreen': value => { events.push(['update:fullScreen', value]); if (behavior.bindState) props.fullScreen = value },
    onFullscreenChange: value => events.push(['fullscreen-change', value]),
    onChange: value => events.push(['change', value]), onFocuse: () => events.push(['focuse']), onBlur: () => events.push(['blur'])
  }, behavior.slots || {}) })
  app.mount({})
  return { updateSlots: () => beforeUpdate.forEach(fn => fn()), app, props, editorRef, editors, providers, events, mountEditor: () => mounted.forEach(fn => fn()) }
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

test('language choice survives equivalent inline props and other external option changes', async () => {
  const h = harness({ monacoOptions: { language: 'sql', theme: 'vs-light', minimap: { enabled: true } } })
  await Vue.nextTick()
  h.editorRef.value.changeLanguage('javascript')
  await Vue.nextTick()
  h.props.monacoOptions = { language: 'sql', theme: 'vs-light', minimap: { enabled: true } }
  await Vue.nextTick()
  assert.equal(h.editorRef.value.computedMonacoEditorOption.language, 'javascript')
  assert.equal(h.editors[0].model.language, 'javascript')
  h.props.monacoOptions.theme = 'vs-dark'
  await Vue.nextTick()
  assert.equal(h.editorRef.value.computedMonacoEditorOption.language, 'javascript')
  h.props.monacoOptions.language = 'python'
  await Vue.nextTick()
  assert.equal(h.editorRef.value.computedMonacoEditorOption.language, 'python')
  assert.equal(h.editors[0].model.language, 'python')
  h.app.unmount()
})

test('editor propagates editing, focus and blur events and inserts code at the cursor', async () => {
  const h = harness({ modelValue: 'ab', needConfirm: false })
  await Vue.nextTick()
  const editor = h.editors[0], api = h.editorRef.value
  editor.handlers.focus()
  editor.setValue('ac')
  editor.handlers.blur()
  assert.deepEqual(h.events, [['focuse'], ['update:modelValue', 'ac'], ['blur'], ['change', 'ac']])
  api.insertCodeString('X')
  assert.equal(editor.getValue(), 'aXc')
  editor.position = null
  api.insertCodeString('ignored')
  assert.equal(editor.getValue(), 'aXc')
  editor.handlers.layout()
  assert.equal(editor.triggers[0][1], 'editor.action.formatDocument')
  api.fullscreenSwitch()
  assert.equal(api.isFullScreen, true)
  h.props.modelValue = 'external'
  h.props.disabled = true
  await Vue.nextTick()
  assert.equal(editor.getValue(), 'external')
  assert.equal(editor.options.readOnly, true)
  h.app.unmount()
})

test('confirmed editing delays value events until commit and bidibind can ignore external replacements', async () => {
  const h = harness({ modelValue: 'initial', needConfirm: true, bidibind: false, remindConfig: [{ language: 'sql', extra: {} }] })
  await Vue.nextTick()
  h.editors[0].setValue('draft')
  h.editors[0].handlers.blur()
  assert.deepEqual(h.events, [['blur']])
  h.props.modelValue = 'external'
  await Vue.nextTick()
  assert.equal(h.editors[0].getValue(), 'draft')
  h.editorRef.value.commit()
  assert.deepEqual(h.events.slice(-2), [['update:modelValue', 'draft'], ['change', 'draft']])
  assert.equal(h.providers[0].language, 'sql')
  h.props.remindConfig = [{ language: 'python', extra: {} }]
  await Vue.nextTick(); await Vue.nextTick()
  assert.equal(h.providers[0].disposed, true)
  assert.equal(h.providers.at(-1).language, 'python')
  h.app.unmount()
})

test('editor handles empty content and unset optional theme without losing the draft', async () => {
  const h = harness({ modelValue: 'initial' })
  await Vue.nextTick()
  h.editors[0].setValue('')
  assert.equal(h.events.at(-1)[1], '')
  h.props.monacoOptions = { theme: undefined }
  await Vue.nextTick()
  h.editorRef.value.refreshMonacoEditor()
  assert.equal(h.editors.at(-1).getValue(), '')
  h.app.unmount()
})

test('editor emits options and fullscreen state, retains local values and accepts external updates', async () => {
  const h = harness({ fullScreen: true, monacoOptions: { theme: 'vs-light', fontSize: 12, language: 'sql' } })
  await Vue.nextTick()
  const editor = h.editorRef.value
  assert.equal(editor.isFullScreen, true)
  editor.fullscreenSwitch()
  assert.equal(editor.isFullScreen, false)
  assert.equal(h.props.fullScreen, true)
  editor.changeFullScreen(false)
  assert.equal(h.events.filter(([e]) => e === 'update:fullScreen').length, 1)
  h.props.fullScreen = false
  await Vue.nextTick()
  h.props.fullScreen = true
  await Vue.nextTick()
  assert.equal(editor.isFullScreen, true)
  editor.resetMonacoEditorOptions({ theme: 'vs-dark', fontSize: 18, language: 'python' })
  const payload = h.events.find(([e]) => e === 'update:monacoOptions')[1]
  assert.equal(payload.theme, 'vs-dark')
  assert.equal(payload.fontSize, 18)
  assert.equal(payload.language, 'python')
  payload.fontSize = 99
  assert.equal(editor.computedMonacoEditorOption.fontSize, 18, 'event payload does not expose mutable internal state')
  const count = h.events.filter(([e]) => e === 'update:monacoOptions').length
  editor.resetMonacoEditorOptions({ theme: 'vs-dark', fontSize: 18, language: 'python' })
  assert.equal(h.events.filter(([e]) => e === 'update:monacoOptions').length, count)
  h.props.monacoOptions = { theme: 'vs-light', fontSize: 12, language: 'sql' }
  await Vue.nextTick()
  assert.equal(editor.computedMonacoEditorOption.fontSize, 18)
  h.props.monacoOptions.fontSize = 24
  await Vue.nextTick()
  assert.equal(editor.computedMonacoEditorOption.fontSize, 24)
  assert.equal(editor.computedMonacoEditorOption.language, 'python')
  h.props.monacoOptions.language = 'json'
  await Vue.nextTick()
  assert.equal(editor.computedMonacoEditorOption.language, 'json')
  assert.equal(h.editors[0].model.language, 'json')
  h.app.unmount()
})

test('ordinary editor handles external changes before initialization and absent option values', async () => {
  const h = harness({ modelValue: 'before' }, { deferMount: true })
  h.props.modelValue = 'external before mount'
  await Vue.nextTick()
  assert.equal(h.editors[0].value, 'external before mount')
  h.props.monacoOptions = null
  await Vue.nextTick()
  h.editorRef.value.resetMonacoEditorOptions({ theme: undefined, language: undefined })
  await Vue.nextTick()
  h.mountEditor()
  await Vue.nextTick()
  h.app.unmount()
})

test('ordinary editor supports parent v-model writeback without duplicate updates', async () => {
  const h = harness({ monacoOptions: { fontSize: 12 }, fullScreen: false }, { bindState: true })
  await Vue.nextTick()
  h.editorRef.value.resetMonacoEditorOptions({ fontSize: 18, theme: 'vs-light', language: 'sql' })
  h.editorRef.value.fullscreenSwitch()
  await Vue.nextTick(); await Vue.nextTick()
  assert.equal(h.props.monacoOptions.fontSize, 18)
  assert.equal(h.editorRef.value.computedMonacoEditorOption.fontSize, 18)
  assert.equal(h.props.fullScreen, true)
  assert.equal(h.events.filter(([e]) => e === 'update:monacoOptions').length, 1)
  assert.equal(h.events.filter(([e]) => e === 'update:fullScreen').length, 1)
  h.props.monacoOptions.fontSize = 24
  await Vue.nextTick()
  assert.equal(h.editorRef.value.computedMonacoEditorOption.fontSize, 24)
  h.app.unmount()
})

test('ordinary editor readonly status and Monaco options follow disabled and readOnly props', async () => {
  const h = harness({ disabled: false, monacoOptions: { readOnly: true } })
  await Vue.nextTick()
  assert.equal(h.editorRef.value.currentReadOnly, true)
  assert.equal(h.editors[0].options.readOnly, true)
  h.props.monacoOptions.readOnly = false
  await Vue.nextTick()
  assert.equal(h.editorRef.value.currentReadOnly, false)
  assert.equal(h.editors[0].options.readOnly, false)
  h.props.disabled = true
  await Vue.nextTick()
  assert.equal(h.editorRef.value.currentReadOnly, true)
  assert.equal(h.editors[0].options.readOnly, true)
  h.props.disabled = false
  await Vue.nextTick()
  assert.equal(h.editorRef.value.currentReadOnly, false)
  h.app.unmount()
})

test('ordinary preview preserves the draft and editor and synchronizes independent view props', async () => {
  const slots = { preview() {} }
  const h = harness({ modelValue: 'draft', viewMode: 'preview' }, { slots })
  await Vue.nextTick()
  const e = h.editorRef.value
  assert.equal(e.currentViewMode, 'preview')
  assert.equal(e.previewContent, 'draft')
  assert.equal(e.currentPreviewSource, 'original')
  assert.equal(e.previewLanguage, 'typescript')
  e.changeViewMode('preview')
  e.togglePreview(); e.togglePreview()
  assert.equal(e.currentViewMode, 'preview')
  assert.equal(h.editors.length, 1)
  h.editors[0].setValue('uncommitted')
  assert.equal(e.previewContent, 'uncommitted')
  h.props.viewMode = 'edit'; await Vue.nextTick()
  assert.equal(e.currentViewMode, 'edit')
  h.props.viewMode = 'preview'; await Vue.nextTick()
  delete slots.preview; h.props.prefix = 'rerender'; await Vue.nextTick(); h.updateSlots()
  assert.equal(e.currentViewMode, 'edit')
  assert.equal(e.hasPreview, false)
  e.changeViewMode('preview')
  e.resetMonacoEditorOptions({ language: undefined })
  assert.equal(e.previewLanguage, 'plaintext')
  h.app.unmount()
  const noSlot = harness({ viewMode: 'preview' })
  assert.equal(noSlot.editorRef.value.currentViewMode, 'edit')
  noSlot.updateSlots(); noSlot.app.unmount()
  const bound = harness({ viewMode: 'edit' }, { slots: { preview() {} }, bindState: true })
  bound.editorRef.value.togglePreview(); await Vue.nextTick()
  assert.equal(bound.props.viewMode, 'preview')
  assert.equal(bound.events.filter(([n]) => n === 'update:viewMode').length, 1)
  bound.app.unmount()
})
