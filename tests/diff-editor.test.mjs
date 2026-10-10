import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'
import * as Ramda from 'ramda'

function harness(overrides = {}, slots = {}) {
  const models = [], mounted = [], unmounted = [], beforeUpdate = [], stops = [], events = []
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
      setTheme() {}, setModelLanguage(model, language) { model.language = language }, getModel: () => null, createDiffEditor: () => diff, create: () => ({ ...editor, dispose() {}, layout() {} }),
      createModel(value, language) {
        let version = 1, listener
        const model = {
          language, getLanguageId() { return this.language }, getValue: () => value, getVersionId: () => version,
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
    if (name === 'vue') return { ...Vue, onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => unmounted.push(fn), onBeforeUpdate: fn => beforeUpdate.push(fn), getCurrentInstance: () => ({ uid: 1 }), watch(...args) { const stop = Vue.watch(...args); stops.push(stop); return stop } }
    if (name === 'ramda') return Ramda
    if (name.endsWith('/sync-monaco-options')) {
      const helper = { exports: {}, require: () => Ramda }
      vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../use.lib/sync-monaco-options.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, helper)
      return helper.exports
    }
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
  Object.assign(props, overrides)
  const exposed = component.setup(props, { slots, emit: (...event) => events.push(event) })
  exposed.MonacoEditorRef.value = {}
  mounted.forEach(fn => fn())
  return {
    exposed, props, models, events,
    updateDiff: () => didUpdateDiff(), getApplied: () => applied,
    updateSlots: () => beforeUpdate.forEach(fn => fn()),
    cleanup() { unmounted.forEach(fn => fn()); stops.forEach(stop => stop()) }
  }
}

test('single-block review waits for current diff and ignores obsolete coordinates', async () => {
  const { exposed, models, updateDiff, getApplied, cleanup } = harness()
  await Vue.nextTick()
  exposed.acceptChange(0)
  assert.equal(getApplied(), 0)
  updateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  exposed.acceptChange(0)
  exposed.acceptChange(0)
  assert.equal(getApplied(), 1)
  assert.equal(exposed.getLineChanges().length, 0)
  await Vue.nextTick()
  models[1].setValue('another')
  exposed.acceptChange(0)
  assert.equal(getApplied(), 1)
  updateDiff()
  exposed.acceptChange(0)
  assert.equal(getApplied(), 2)
  assert.equal(models[0].getValue(), 'another')
  await Vue.nextTick()
  exposed.changeDisplayMode('original')
  assert.equal(exposed.diffPending.value, true)
  updateDiff()
  assert.equal(exposed.diffPending.value, false)
  assert.equal(exposed.getLineChanges().length, 0)
  models[1].setValue('new proposal')
  assert.equal(exposed.diffPending.value, true)
  updateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  exposed.changeDisplayMode('modified')
  updateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  models[0].setValue('new proposal')
  updateDiff()
  assert.equal(exposed.getLineChanges().length, 0)
  await Vue.nextTick()
  cleanup()
})


test('preview selects the source draft and preserves uncommitted edits across modes', async () => {
  const h = harness({ displayMode: 'original', needConfirm: true }, { preview: () => [] })
  await Vue.nextTick()
  h.models[0].setValue('uncommitted original')
  h.exposed.changeDisplayMode('preview')
  assert.equal(h.exposed.currentDisplayMode.value, 'preview')
  assert.equal(h.exposed.currentPreviewSource.value, 'original')
  assert.equal(h.exposed.previewContent.value, 'uncommitted original')
  assert.equal(h.exposed.getOriginalEditor(), null)
  assert.equal(h.exposed.getModifiedEditor(), null)
  h.exposed.changePreviewSource('modified')
  h.models[1].setValue('uncommitted proposal')
  assert.equal(h.exposed.previewContent.value, 'uncommitted proposal')
  assert.equal(h.events.some(([name]) => name.startsWith('update:')), false)
  h.exposed.changeDisplayMode('diff')
  h.exposed.changeDisplayMode('preview')
  assert.equal(h.exposed.currentPreviewSource.value, 'modified')
  assert.equal(h.models[0].getValue(), 'uncommitted original')
  assert.equal(h.models[1].getValue(), 'uncommitted proposal')
  h.exposed.changeLanguage('markdown')
  assert.equal(h.exposed.previewLanguage.value, 'markdown')
  h.exposed.commit()
  assert.ok(h.events.some(([name, value]) => name === 'update:modifiedValue' && value === 'uncommitted proposal'))
  await Vue.nextTick()
  h.cleanup()
})

test('preview requires a slot, supports explicit source and handles slot removal', async () => {
  const unavailable = harness({ displayMode: 'preview' })
  await Vue.nextTick()
  assert.equal(unavailable.exposed.hasPreview.value, false)
  assert.equal(unavailable.exposed.currentDisplayMode.value, 'modified')
  unavailable.exposed.changeDisplayMode('preview')
  assert.equal(unavailable.exposed.currentDisplayMode.value, 'modified')
  unavailable.cleanup()
  const slots = { preview: () => [] }
  const h = harness({ displayMode: 'preview', previewSource: 'original' }, slots)
  await Vue.nextTick()
  assert.equal(h.exposed.previewContent.value, 'old')
  h.props.previewSource = 'modified'
  await Vue.nextTick()
  assert.equal(h.exposed.previewContent.value, 'new')
  delete slots.preview
  h.updateSlots()
  assert.equal(h.exposed.hasPreview.value, false)
  assert.equal(h.exposed.currentDisplayMode.value, 'modified')
  await Vue.nextTick()
  h.cleanup()
})


test('preview toggle restores the previous editing mode', async () => {
  for (const mode of ['original', 'modified', 'diff']) {
    const h = harness({ displayMode: mode }, { preview: () => [] })
    await Vue.nextTick()
    h.exposed.togglePreview()
    assert.equal(h.exposed.currentDisplayMode.value, 'preview')
    h.exposed.togglePreview()
    assert.equal(h.exposed.currentDisplayMode.value, mode)
    await Vue.nextTick()
    h.cleanup()
  }
})

test('language remains consistent across parent rerenders, external changes and preview', async () => {
  const h = harness({ monacoOptions: { language: 'sql', theme: 'vs-light' } }, { preview: () => [] })
  await Vue.nextTick()
  h.exposed.changeLanguage('javascript')
  await Vue.nextTick()
  h.props.monacoOptions = { language: 'sql', theme: 'vs-light' }
  await Vue.nextTick()
  assert.equal(h.exposed.computedMonacoEditorOption.value.language, 'javascript')
  assert.ok(h.models.every(model => model.language === 'javascript'))
  h.exposed.togglePreview()
  assert.equal(h.exposed.previewLanguage.value, 'javascript')
  h.props.monacoOptions.language = 'python'
  await Vue.nextTick()
  assert.equal(h.exposed.previewLanguage.value, 'python')
  assert.ok(h.models.every(model => model.language === 'python'))
  h.exposed.togglePreview()
  assert.ok(h.models.every(model => model.language === 'python'))
  await Vue.nextTick()
  h.cleanup()
})
