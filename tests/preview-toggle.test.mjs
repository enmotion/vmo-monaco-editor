import { test } from 'node:test'
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
    if (name === './use-monaco-control') return { createVmoMonacoControlProps: () => ({}), useVmoMonacoControl: () => ({ monacos: Vue.ref(targets) }) }
    throw new Error(name)
  } }
  runInNewContext(transpileModule(source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1], { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const component = context.exports.default
  component.render = new Function('Vue', compile(source.match(/<template>([\s\S]*?)<\/template>/)[1], { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  return component
}
function editor(mode, hasPreview = true) {
  let previous = mode
  return Vue.reactive({
    hasPreview, currentDisplayMode: mode,
    changeDisplayMode(next) { previous = this.currentDisplayMode; this.currentDisplayMode = next },
    togglePreview() { this.currentDisplayMode = previous }
  })
}
test('standalone preview control enters and restores each eligible target independently', () => {
  const original = editor('original'), diff = editor('diff'), unavailable = editor('modified', false)
  const events = []
  const control = load([original, diff, unavailable]).setup({}, { emit: (...event) => events.push(event) })
  control.togglePreview()
  assert.equal(control.currentValue.value, true)
  assert.equal(original.currentDisplayMode, 'preview')
  assert.equal(diff.currentDisplayMode, 'preview')
  assert.equal(unavailable.currentDisplayMode, 'modified')
  assert.equal(events.at(-1)[1].monacoCount, 2)
  control.togglePreview()
  assert.equal(original.currentDisplayMode, 'original')
  assert.equal(diff.currentDisplayMode, 'diff')
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
