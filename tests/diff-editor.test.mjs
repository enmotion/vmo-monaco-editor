import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import * as Ramda from 'ramda'

test('single-block review waits for current diff and ignores obsolete coordinates', async () => {
  const models = [], mounted = [], unmounted = [], stops = []
  let didUpdateDiff, applied = 0
  const change = { originalStartLineNumber: 1, originalEndLineNumber: 1, modifiedStartLineNumber: 1, modifiedEndLineNumber: 1 }
  const disposable = () => ({ dispose() {} })
  const editor = { updateOptions() {}, onDidFocusEditorText: disposable, onDidBlurEditorText: disposable, onMouseDown: disposable }
  const diff = {
    setModel() {}, getOriginalEditor: () => editor, getModifiedEditor: () => editor,
    onDidUpdateDiff(fn) { didUpdateDiff = fn; return disposable() },
    getLineChanges: () => models[0].getValue() === models[1].getValue() ? [] : [change], updateOptions() {}, layout() {}, dispose() {}
  }
  const Monaco = {
    Uri: { parse: value => value },
    editor: {
      setTheme() {}, getModel: () => null, createDiffEditor: () => diff, create: () => ({ ...editor, dispose() {}, layout() {} }),
      createModel(value) {
        let version = 1, listener
        const model = {
          getValue: () => value, getVersionId: () => version,
          setValue(next) { value = next; version++; listener?.() },
          onDidChangeContent(fn) { listener = fn; return disposable() }, dispose() {}
        }
        models.push(model)
        return model
      }
    }
  }
  const source = fs.readFileSync(new URL('../components/vmo-monaco-diff-editor/vmo-monaco-diff-editor.vue', import.meta.url), 'utf8').match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]
  const context = { exports: {}, document: { createElement: () => ({}) }, requestAnimationFrame: fn => fn(), require(name) {
    if (name === 'vue') return { ...Vue, onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => unmounted.push(fn), getCurrentInstance: () => ({ uid: 1 }), watch(...args) { const stop = Vue.watch(...args); stops.push(stop); return stop } }
    if (name === 'ramda') return Ramda
    if (name.startsWith('monaco-editor')) return Monaco
    if (name.endsWith('/config')) return { vmoMonacoEditorDefaultOption: { language: 'plaintext', theme: 'vs-dark' } }
    if (name === './review') return {
      createReviewActionMaps: () => ({}), getNativeDiffAction: () => null, getReviewActionIndex: () => undefined,
      applyLineChange({ originalModel, modifiedModel }, index) {
        applied++
        originalModel.setValue(modifiedModel.getValue())
        return index === 0 ? change : null
      }
    }
    throw new Error(name)
  } }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const component = context.exports.default
  const props = Vue.reactive(Object.fromEntries(Object.entries(component.props).map(([key, option]) => [key, typeof option.default === 'function' ? option.default() : option.default])))
  props.originalValue = 'old'; props.modifiedValue = 'new'
  const exposed = component.setup(props, { emit() {} })
  exposed.MonacoEditorRef.value = {}
  mounted.forEach(fn => fn())
  await Vue.nextTick()
  exposed.acceptChange(0)
  assert.equal(applied, 0)
  didUpdateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  exposed.acceptChange(0)
  exposed.acceptChange(0)
  assert.equal(applied, 1)
  assert.equal(exposed.getLineChanges().length, 0)
  await Vue.nextTick()
  models[1].setValue('another')
  exposed.acceptChange(0)
  assert.equal(applied, 1)
  didUpdateDiff()
  exposed.acceptChange(0)
  assert.equal(applied, 2)
  assert.equal(models[0].getValue(), 'another')
  await Vue.nextTick()
  exposed.changeDisplayMode('original')
  assert.equal(exposed.diffPending.value, true)
  didUpdateDiff()
  assert.equal(exposed.diffPending.value, false)
  assert.equal(exposed.getLineChanges().length, 0)
  models[1].setValue('new proposal')
  assert.equal(exposed.diffPending.value, true)
  didUpdateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  exposed.changeDisplayMode('modified')
  didUpdateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  models[0].setValue('new proposal')
  didUpdateDiff()
  assert.equal(exposed.getLineChanges().length, 0)
  await Vue.nextTick()
  unmounted.forEach(fn => fn())
  stops.forEach(stop => stop())
})
