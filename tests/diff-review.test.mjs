import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transpileModule, runInNewContext } from './helpers/source-runtime.mjs'
import ts from 'typescript'
import * as Vue from 'vue'
import { compile } from '@vue/compiler-dom'
import { renderToString } from '@vue/server-renderer'

async function render(mode, changes, pending = false, hasPreview = false) {
  const source = fs.readFileSync(new URL('../components/vmo-monaco-ui/controls/diff-review.vue', import.meta.url), 'utf8')
  const target = { hasPreview, currentDisplayMode: mode, currentDiffViewMode: 'inline', lineChanges: changes, diffPending: pending, acceptAllChanges() {}, getLineChanges: () => changes }
  const context = { exports: {}, require(name) {
    if (name === 'vue') return Vue
    if (name === './use-monaco-control') return { createVmoMonacoControlProps: () => ({}), useVmoMonacoControl: () => ({ monacos: Vue.ref([target]) }) }
    throw new Error(name)
  } }
  runInNewContext(transpileModule(source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1], { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const component = context.exports.default
  const setup = component.setup
  component.setup = (...args) => { const result = setup(...args); result.isOpen.value = true; return result }
  component.render = new Function('Vue', compile(source.match(/<template>([\s\S]*?)<\/template>/)[1], { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  return renderToString(Vue.h(component))
}
for (const mode of ['original', 'modified']) {
  test(`${mode} shows live count and hides diff-only operations`, async () => {
    const html = await render(mode, [{}, {}])
    assert.match(html, /2 diff blocks/)
    assert.doesNotMatch(html, /title="Side by side"|title="Inline"|title="Accept all"|title="Reject all"/)
    assert.match(html, /title="Diff"/)
  })
}
test('single view shows pending status rather than zero', async () => {
  const html = await render('original', [], true)
  assert.match(html, /Calculating differences/)
  assert.match(html, /…/)
})
test('diff shows layout and review controls without count', async () => {
  const html = await render('diff', [{}])
  assert.match(html, /title="Side by side"/)
  assert.match(html, /title="Inline"/)
  assert.match(html, /title="Accept all"/)
  assert.match(html, /title="Reject all"/)
  assert.doesNotMatch(html, /class="reviewCount"| disabled/)
})
test('review controls disabled for zero differences or pending calculation', async () => {
  for (const pending of [false, true]) {
    const html = await render('diff', [], pending)
    assert.match(html, /aria-label="Accept all" disabled/)
    assert.match(html, /aria-label="Reject all" disabled/)
  }
})


test('review popover has no Preview switch even when preview is available', async () => {
  for (const mode of ['original', 'modified', 'diff', 'preview']) {
    const html = await render(mode, [{}], false, true)
    assert.doesNotMatch(html, /title="Preview"|reviewPreviewButton/)
  }
  const preview = await render('preview', [{}], false, true)
  assert.doesNotMatch(preview, /reviewCount|title="Side by side"|title="Inline"|title="Accept all"|title="Reject all"/)
})
