import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transpileModule, runInNewContext } from './helpers/source-runtime.mjs'
import ts from 'typescript'
import * as Vue from 'vue'
import * as Ramda from 'ramda'

function harness(overrides = {}, slots = {}, behavior = {}) {
  const models = [], mounted = [], unmounted = [], beforeUpdate = [], stops = [], events = []
  let didUpdateDiff, applied = 0, calculationPending = false, collision = !!behavior.collision
  const mouseHandlers = [], focusHandlers = [], blurHandlers = [], uriQueries = []
  const change = { originalStartLineNumber: 1, originalEndLineNumber: 1, modifiedStartLineNumber: 1, modifiedEndLineNumber: 1 }
  const disposable = () => ({ dispose() {} })
  const editor = { updateOptions(options) { this.options = options },
    onDidFocusEditorText(fn) { focusHandlers.push(fn); return disposable() },
    onDidBlurEditorText(fn) { blurHandlers.push(fn); return disposable() },
    onMouseDown(fn) { mouseHandlers.push(fn); return disposable() }
  }
  const diff = {
    setModel() {}, getOriginalEditor: () => editor, getModifiedEditor: () => editor,
    onDidUpdateDiff(fn) { didUpdateDiff = fn; return disposable() },
    getLineChanges: () => calculationPending ? null : models[0].getValue() === models[1].getValue() ? [] : [change],
    updateOptions(options) { this.options = options }, layout() {}, dispose() {}
  }
  const Monaco = {
    Uri: { parse: value => value },
    editor: {
      setTheme() {}, setModelLanguage(model, language) { model.language = language },
      getModel(uri) { uriQueries.push(uri); if (collision) { collision = false; return {} } return null },
      createDiffEditor: () => diff, create: () => ({ ...editor, dispose() {}, layout() {} }),
      createModel(value, language, uri) {
        let version = 1, listener
        const model = {
          language, uri, getLanguageId() { return this.language }, getValue: () => value, getVersionId: () => version,
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
      runInNewContext(transpileModule(fs.readFileSync(new URL('../use.lib/sync-monaco-options.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, helper)
      return helper.exports
    }
    if (name.startsWith('monaco-editor')) return Monaco
    if (name.endsWith('/config')) return { vmoMonacoEditorDefaultOption: { language: 'plaintext', theme: 'vs-dark' } }
    if (name === './review') return {
      createReviewActionMaps: () => ({}), getNativeDiffAction: event => event.action || null,
      getReviewActionIndex: ({ lineNumber }) => lineNumber === 1 ? 0 : undefined,
      applyLineChange({ originalModel, modifiedModel }, index, action) {
        if (index !== 0) return null
        applied++
        if (action === 'accept') originalModel.setValue(modifiedModel.getValue())
        else modifiedModel.setValue(originalModel.getValue())
        return change
      }
    }
    throw new Error(name)
  } }
  runInNewContext(transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  const component = context.exports.default
  const props = Vue.reactive(Object.fromEntries(Object.entries(component.props).map(([key, option]) => [key, typeof option.default === 'function' ? option.default() : option.default])))
  props.originalValue = 'old'; props.modifiedValue = 'new'
  Object.assign(props, overrides)
  const exposed = component.setup(props, { slots, emit: (...event) => events.push(event) })
  exposed.MonacoEditorRef.value = {}
  mounted.forEach(fn => fn())
  return {
    exposed, props, models, events, editor, diff, uriQueries,
    pending: value => { calculationPending = value },
    focus: () => focusHandlers.at(-1)(), blur: () => blurHandlers.at(-1)(),
    mouse: (side, event) => mouseHandlers.slice(-2)[side === 'original' ? 0 : 1](event),
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

test('diff supports all review actions, confirmation, focus events and both public editor views', async () => {
  const h = harness()
  await Vue.nextTick()
  assert.equal(h.exposed.getOriginalEditor(), h.editor)
  assert.equal(h.exposed.getModifiedEditor(), h.editor)
  h.focus(); h.blur()
  assert.ok(h.events.some(([name]) => name === 'focuse'))
  assert.ok(h.events.some(([name]) => name === 'change'))
  h.updateDiff()
  h.exposed.acceptChange(99)
  assert.equal(h.getApplied(), 0)
  h.exposed.rejectChange(0)
  await Vue.nextTick()
  assert.equal(h.models[1].getValue(), 'old')
  assert.ok(h.events.some(([name]) => name === 'reject-change'))
  h.models[1].setValue('new proposal')
  h.exposed.acceptAllChanges()
  await Vue.nextTick()
  assert.equal(h.models[0].getValue(), 'new proposal')
  h.models[1].setValue('rejected proposal')
  h.exposed.rejectAllChanges()
  await Vue.nextTick()
  assert.equal(h.models[1].getValue(), 'new proposal')
  assert.ok(h.events.some(([name]) => name === 'accept-all'))
  assert.ok(h.events.some(([name]) => name === 'reject-all'))
  h.exposed.confirm()
  assert.equal(h.events.at(-1)[1].confirmedValue, 'new proposal')
  h.exposed.fullscreenSwitch()
  assert.equal(h.exposed.isFullScreen.value, true)
  h.exposed.changeDisplayMode('original')
  assert.ok(h.exposed.getOriginalEditor())
  assert.equal(h.exposed.getModifiedEditor(), null)
  h.exposed.changeDisplayMode('modified')
  assert.ok(h.exposed.getModifiedEditor())
  assert.equal(h.exposed.getOriginalEditor(), null)
  await Vue.nextTick(); h.cleanup()
})

test('diff handles pending calculations, hot props, layout changes, readonly options and URI collisions', async () => {
  const h = harness({ originalUri: 'custom-original', modifiedUri: 'custom-modified' }, {}, { collision: true })
  await Vue.nextTick()
  assert.match(h.models[0].uri, /custom-original-1-1$/)
  assert.equal(h.models[1].uri, 'inmemory://custom-modified')
  h.pending(true); h.updateDiff()
  assert.equal(h.exposed.diffPending.value, true)
  h.pending(false); h.updateDiff()
  assert.equal(h.exposed.diffPending.value, false)
  h.props.originalValue = 'external original'
  h.props.modifiedValue = 'external modified'
  h.props.diffOptions = { renderIndicators: false }
  h.props.diffViewMode = 'inline'
  h.props.disabled = true
  await Vue.nextTick(); await Vue.nextTick()
  assert.equal(h.models[0].getValue(), 'external original')
  assert.equal(h.models[1].getValue(), 'external modified')
  assert.equal(h.diff.options.renderSideBySide, false)
  assert.equal(h.diff.options.renderIndicators, false)
  assert.equal(h.diff.options.readOnly, true)
  h.exposed.changeDiffViewMode('side-by-side')
  h.exposed.changeDiffViewMode('side-by-side')
  h.props.displayMode = 'original'
  await Vue.nextTick()
  h.props.diffViewMode = 'side-by-side'
  h.exposed.changeDiffViewMode('inline')
  await Vue.nextTick()
  assert.equal(h.exposed.currentDisplayMode.value, 'original')
  assert.equal(h.exposed.computedMonacoEditorOption.value.lightbulb.enabled, false)
  h.props.bidibind = false
  h.props.originalValue = 'ignored'
  await Vue.nextTick()
  assert.equal(h.models[0].getValue(), 'external original')
  h.cleanup()
})

test('native diff actions require a current calculation, an action and a mapped line', async () => {
  const h = harness()
  await Vue.nextTick()
  const click = { action: 'accept', target: { position: { lineNumber: 1 } } }
  h.mouse('original', click)
  assert.equal(h.getApplied(), 0)
  h.updateDiff()
  h.props.showReviewActions = false
  h.mouse('original', click)
  assert.equal(h.getApplied(), 0)
  h.props.showReviewActions = true
  h.mouse('original', { target: { position: { lineNumber: 1 } } })
  h.mouse('modified', { action: 'accept', target: {} })
  h.mouse('modified', { action: 'accept', target: { position: { lineNumber: 99 } } })
  assert.equal(h.getApplied(), 0)
  h.mouse('modified', { action: 'reject', target: { range: { startLineNumber: 1 } } })
  await Vue.nextTick()
  assert.equal(h.getApplied(), 1)
  assert.equal(h.models[1].getValue(), h.models[0].getValue())
  h.cleanup()
})

test('diff handles empty drafts, optional configuration removal and calls after resource disposal', async () => {
  const h = harness({ needConfirm: true }, { preview: () => [] })
  await Vue.nextTick()
  h.models[0].setValue(''); h.models[1].setValue('')
  h.exposed.acceptAllChanges(); h.exposed.rejectAllChanges()
  h.blur()
  await Vue.nextTick()
  assert.equal(h.events.some(([name]) => name === 'change'), false)
  h.props.monacoOptions = { theme: undefined, language: undefined }
  h.props.diffOptions = undefined
  h.props.previewSource = 'original'
  await Vue.nextTick()
  h.props.previewSource = undefined
  h.exposed.changeDisplayMode('preview')
  assert.equal(h.exposed.previewLanguage.value, 'plaintext')
  h.exposed.resetMonacoDiffEditorOptions({ renderIndicators: false })
  h.exposed.changeDisplayMode('diff')
  await Vue.nextTick()
  assert.equal(h.diff.options.renderIndicators, false)
  h.exposed.changePreviewSource('original')
  h.props.bidibind = false
  h.props.modifiedValue = 'ignored'
  await Vue.nextTick()
  assert.equal(h.models[1].getValue(), '')
  h.exposed.MonacoEditorRef.value = null
  h.exposed.refreshMonacoEditor()
  h.exposed.MonacoEditorRef.value = {}
  h.exposed.refreshMonacoEditor()
  await Vue.nextTick()
  h.cleanup()
  h.exposed.refreshMonacoEditor()
  h.exposed.acceptAllChanges(); h.exposed.rejectAllChanges()
  await Vue.nextTick()
  assert.equal(h.exposed.getDiffEditor(), null)
})
