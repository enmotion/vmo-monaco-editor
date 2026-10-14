import { test } from 'node:test'
import { createLibraryLoader } from './helpers/load-library.mjs'
const controlValueHelper = createLibraryLoader()('components/vmo-monaco-ui/controls/use-monaco-control.ts').useVmoMonacoControlValue
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transpileModule, runInNewContext } from './helpers/source-runtime.mjs'
import ts from 'typescript'
import * as Vue from 'vue'
import { compile } from '@vue/compiler-dom'
import { renderToString } from '@vue/server-renderer'

function load(targets) {
  const source = fs.readFileSync(new URL('../components/vmo-monaco-ui/controls/preview-toggle.vue', import.meta.url), 'utf8')
  const context = { exports: {}, require(name) {
    if (name === 'vue') return Vue
    if (name === './use-monaco-control') return { useVmoMonacoControlValue: controlValueHelper, createVmoMonacoControlProps: () => ({}), useVmoMonacoControl: () => ({ monacos: Vue.ref(targets) }) }
    throw new Error(name)
  } }
  runInNewContext(transpileModule(source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1], { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const component = context.exports.default
  component.render = new Function('Vue', compile(source.match(/<template>([\s\S]*?)<\/template>/)[1], { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  return component
}
function editor(mode, hasPreview = true) {
  return Vue.reactive({
    hasPreview, currentViewMode: 'edit', currentEditMode: mode,
    changeViewMode(next) { this.currentViewMode = next },
    togglePreview() { this.currentViewMode = this.currentViewMode === 'preview' ? 'edit' : 'preview' }
  })
}
test('standalone preview control enters and restores each eligible target independently', () => {
  const original = editor('original'), diff = editor('diff'), unavailable = editor('modified', false)
  const events = []
  const control = load([original, diff, unavailable]).setup({}, { emit: (...event) => events.push(event) })
  control.togglePreview()
  assert.equal(control.currentValue.value, true)
  assert.equal(original.currentViewMode, 'preview')
  assert.equal(diff.currentViewMode, 'preview')
  assert.equal(unavailable.currentViewMode, 'edit')
  assert.equal(events.at(-1)[1].monacoCount, 2)
  control.togglePreview()
  assert.equal(original.currentViewMode, 'edit')
  assert.equal(diff.currentViewMode, 'edit')
  assert.equal(control.currentValue.value, false)
})
test('preview toggle is a standalone accessible button and supports custom content', async () => {
  const component = load([editor('modified')])
  const html = await renderToString(Vue.h(component))
  assert.match(html, /class="vmo-preview-toggle(?:\s[^"]*)?"/)
  assert.match(html, /type="button"/)
  assert.match(html, /aria-label="[^"]+"/)
  assert.match(html, /aria-pressed="false"/)
  assert.doesNotMatch(html, /reviewPanel/)
  const custom = await renderToString(Vue.h(component, {}, { default: () => Vue.h('span', { class: 'my-icon' }, 'Custom preview') }))
  assert.match(custom, /my-icon/)
})
test('preview toggle hides without a capable target and emits no action', async () => {
  const component = load([editor('modified', false)])
  assert.doesNotMatch(await renderToString(Vue.h(component)), /<button/)
  const events = []
  component.setup({}, { emit: (...event) => events.push(event) }).togglePreview()
  assert.equal(events.length, 0)
})

test('preview toggle honors controlled state and tolerates an empty editor selection', () => {
  const events = [], target = editor('diff')
  const control = load([target]).setup({ value: true }, { emit: (...event) => events.push(event) })
  control.togglePreview()
  assert.equal(events.find(([name]) => name === 'toggle')[1], false)
  assert.equal(load([]).setup({}, { emit() {} }).currentValue.value, false)
})

test('preview props synchronize targets while unchanged props preserve internal toggles', () => {
  const target = editor('original'), scope = Vue.effectScope(), props = Vue.reactive({ value: true }), events = []
  const control = scope.run(() => load([target]).setup(props, { emit: (...e) => events.push(e) }))
  assert.equal(target.currentViewMode, 'preview')
  control.togglePreview()
  assert.equal(target.currentViewMode, 'edit')
  assert.equal(control.currentValue.value, false)
  assert.equal(props.value, true)
  control.togglePreview()
  props.value = false
  assert.equal(target.currentViewMode, 'edit')
  assert.equal(control.currentValue.value, false)
  props.value = true
  assert.equal(target.currentViewMode, 'preview')
  assert.equal(control.currentValue.value, true)
  props.value = undefined
  target.togglePreview()
  assert.equal(control.currentValue.value, false)
  scope.stop()
})

test('preview control supports ordinary and diff editors through independent viewMode', () => {
  const targets = ['original', 'diff'].map(editMode => Vue.reactive({ hasPreview: true, currentViewMode: 'edit', editMode,
    changeViewMode(mode) { this.currentViewMode = mode }, togglePreview() {} }))
  const control = load(targets).setup({}, { emit() {} })
  control.togglePreview()
  assert.equal(targets[0].currentViewMode, 'preview')
  assert.equal(targets[1].editMode, 'diff')
  control.togglePreview()
  assert.equal(targets[1].currentViewMode, 'edit')
})

test('source controls appear only for different nonempty diff previews and switch through the editor API', async () => {
  const target = editor('diff')
  Object.assign(target, {
    hasContentChanges: true,
    hasModifiedContent: true,
    currentPreviewSource: 'modified',
    changePreviewSource(source) { this.currentPreviewSource = source }
  })
  const component = load([target])
  assert.doesNotMatch(await renderToString(Vue.h(component)), /aria-label="Preview source"/)
  target.currentViewMode = 'preview'
  assert.match(await renderToString(Vue.h(component)), /aria-label="Preview source"/)
  component.setup({}, { emit() {} }).changePreviewSource('original')
  assert.equal(target.currentPreviewSource, 'original')
  target.hasContentChanges = false
  assert.doesNotMatch(await renderToString(Vue.h(component)), /aria-label="Preview source"/)
  target.hasContentChanges = true
  target.hasModifiedContent = false
  assert.doesNotMatch(await renderToString(Vue.h(component)), /aria-label="Preview source"/)
})

test('source switching affects previewing diff targets and preserves editing targets', () => {
  function target(viewMode, source) {
    return Vue.reactive({
      ...editor('diff'), currentViewMode: viewMode, currentPreviewSource: source,
      hasContentChanges: true,
      changePreviewSource(next) { this.currentPreviewSource = next }
    })
  }
  const first = target('preview', 'modified')
  const editing = target('edit', 'modified')
  const second = target('preview', 'modified')
  const control = load([first, editing, second, editor('original')]).setup({}, { emit() {} })
  control.changePreviewSource('original')
  assert.equal(first.currentPreviewSource, 'original')
  assert.equal(second.currentPreviewSource, 'original')
  assert.equal(editing.currentPreviewSource, 'modified')
  assert.equal(editing.currentViewMode, 'edit')
  load([]).setup({}, { emit() {} }).changePreviewSource('original')
})
