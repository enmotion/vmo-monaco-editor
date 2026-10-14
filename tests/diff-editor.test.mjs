import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transpileModule, runInNewContext } from './helpers/source-runtime.mjs'
import ts from 'typescript'
import { createLibraryLoader } from './helpers/load-library.mjs'
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
    if (name === 'vue') return { ...Vue, onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => unmounted.push(fn), onBeforeUpdate: fn => beforeUpdate.push(fn), getCurrentInstance: () => behavior.noInstance ? null : ({ uid: 1 }), watch(...args) { const stop = Vue.watch(...args); stops.push(stop); return stop } }
    if (name === 'ramda') return Ramda
    if (name.endsWith('/use-editor-state')) return createLibraryLoader({ vue: context.require('vue') })('use.lib/use-editor-state.ts')
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
  const exposed = component.setup(props, { slots, emit: (...event) => { events.push(event); behavior.onEvent?.(event, props) } })
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
  exposed.changeEditMode('original')
  assert.equal(exposed.diffPending.value, true)
  updateDiff()
  assert.equal(exposed.diffPending.value, false)
  assert.equal(exposed.getLineChanges().length, 0)
  models[1].setValue('new proposal')
  assert.equal(exposed.diffPending.value, true)
  updateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  exposed.changeEditMode('modified')
  updateDiff()
  assert.equal(exposed.getLineChanges().length, 1)
  models[0].setValue('new proposal')
  updateDiff()
  assert.equal(exposed.getLineChanges().length, 0)
  await Vue.nextTick()
  cleanup()
})


test('preview selects the source draft and preserves uncommitted edits across modes', async () => {
  const h = harness({ editMode: 'original', needConfirm: true }, { preview: () => [] })
  await Vue.nextTick()
  h.models[0].setValue('uncommitted original')
  h.exposed.changeViewMode('preview')
  assert.equal(h.exposed.currentViewMode.value, 'preview')
  assert.equal(h.exposed.currentPreviewSource.value, 'original')
  assert.equal(h.exposed.previewContent.value, 'uncommitted original')
  assert.equal(h.exposed.getOriginalEditor(), null)
  assert.equal(h.exposed.getModifiedEditor(), null)
  h.exposed.changePreviewSource('modified')
  h.models[1].setValue('uncommitted proposal')
  assert.equal(h.exposed.previewContent.value, 'uncommitted proposal')
  assert.equal(h.events.some(([name]) => name === 'update:originalValue' || name === 'update:modifiedValue'), false)
  h.exposed.changeEditMode('diff')
  h.exposed.changeViewMode('edit')
  h.exposed.changeViewMode('preview')
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
  const unavailable = harness({ viewMode: 'preview' })
  await Vue.nextTick()
  assert.equal(unavailable.exposed.hasPreview.value, false)
  assert.equal(unavailable.exposed.currentViewMode.value, 'edit')
  assert.equal(unavailable.exposed.currentEditMode.value, 'diff')
  unavailable.exposed.changeViewMode('preview')
  assert.equal(unavailable.exposed.currentViewMode.value, 'edit')
  assert.equal(unavailable.exposed.currentEditMode.value, 'diff')
  unavailable.updateSlots()
  unavailable.cleanup()
  const slots = { preview: () => [] }
  const h = harness({ viewMode: 'preview', previewSource: 'original' }, slots)
  await Vue.nextTick()
  assert.equal(h.exposed.previewContent.value, 'old')
  h.props.previewSource = 'modified'
  await Vue.nextTick()
  assert.equal(h.exposed.previewContent.value, 'new')
  h.updateSlots()
  delete slots.preview
  h.updateSlots()
  assert.equal(h.exposed.hasPreview.value, false)
  assert.equal(h.exposed.currentViewMode.value, 'edit')
  assert.equal(h.exposed.currentEditMode.value, 'diff')
  await Vue.nextTick()
  h.cleanup()
})


test('preview toggle restores the previous editing mode', async () => {
  for (const mode of ['original', 'modified', 'diff']) {
    const h = harness({ editMode: mode }, { preview: () => [] })
    await Vue.nextTick()
    h.exposed.togglePreview()
    assert.equal(h.exposed.currentViewMode.value, 'preview')
    h.exposed.togglePreview()
    assert.equal(h.exposed.currentViewMode.value, 'edit')
    assert.equal(h.exposed.currentEditMode.value, mode)
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
  h.exposed.changeEditMode('original')
  assert.ok(h.exposed.getOriginalEditor())
  assert.equal(h.exposed.getModifiedEditor(), null)
  h.exposed.changeEditMode('modified')
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
  h.props.editMode = 'original'
  await Vue.nextTick()
  h.props.diffViewMode = 'side-by-side'
  h.exposed.changeDiffViewMode('inline')
  await Vue.nextTick()
  assert.equal(h.exposed.currentEditMode.value, 'original')
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
  h.exposed.changeViewMode('preview')
  assert.equal(h.exposed.previewLanguage.value, 'plaintext')
  h.exposed.resetMonacoDiffEditorOptions({ renderIndicators: false })
  h.exposed.changeViewMode('edit')
  h.exposed.changeEditMode('diff')
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

test('diff editor exposes v-model events for modes, settings and fullscreen without losing internal state', async () => {
  const h = harness({ editMode: 'original', previewSource: 'original', fullScreen: true,
    monacoOptions: { language: 'sql', theme: 'vs-light', fontSize: 12 }, diffOptions: { ignoreTrimWhitespace: true }
  }, { preview() {} })
  await Vue.nextTick()
  const e = h.exposed
  const values = name => h.events.filter(([event]) => event === name).map(([, value]) => value)
  e.changeEditMode('modified')
  assert.deepEqual(values('update:editMode'), ['modified'])
  assert.equal(h.props.editMode, 'original')
  h.props.disabled = true
  await Vue.nextTick()
  assert.equal(e.currentEditMode.value, 'modified')
  h.props.editMode = 'diff'
  await Vue.nextTick()
  assert.equal(e.currentEditMode.value, 'diff')
  e.changeViewMode('preview')
  e.changePreviewSource('modified')
  e.togglePreview(); e.togglePreview()
  assert.equal(e.currentPreviewSource.value, 'modified', 'stale source prop must not override local source on re-entry')
  assert.deepEqual(values('update:previewSource'), ['modified'])
  h.props.previewSource = 'modified'
  await Vue.nextTick()
  h.props.previewSource = 'original'
  await Vue.nextTick()
  assert.equal(e.currentPreviewSource.value, 'original')
  e.changeDiffViewMode('inline')
  e.changeDiffViewMode('inline')
  assert.deepEqual(values('update:diffViewMode'), ['inline'])
  assert.deepEqual(values('diff-view-mode-change'), ['inline'])
  h.props.diffViewMode = 'inline'
  await Vue.nextTick()
  h.props.diffViewMode = 'side-by-side'
  await Vue.nextTick()
  assert.equal(e.currentDiffViewMode.value, 'side-by-side')
  e.fullscreenSwitch(); e.changeFullScreen(false)
  assert.deepEqual(values('update:fullScreen'), [false])
  h.props.fullScreen = false
  await Vue.nextTick()
  h.props.fullScreen = true
  await Vue.nextTick()
  assert.equal(e.isFullScreen.value, true)
  e.resetMonacoEditorOptions({ theme: 'vs-dark', fontSize: 18, language: 'python' })
  e.resetMonacoEditorOptions({ fontSize: 18 })
  assert.equal(values('update:monacoOptions').length, 1)
  assert.equal(values('options-change')[0].language, 'python')
  values('update:monacoOptions')[0].fontSize = 99
  assert.equal(e.computedMonacoEditorOption.value.fontSize, 18)
  e.resetMonacoDiffEditorOptions({ ignoreTrimWhitespace: false })
  e.resetMonacoDiffEditorOptions({ ignoreTrimWhitespace: false })
  assert.equal(values('update:diffOptions').length, 1)
  assert.equal(values('diff-options-change')[0].ignoreTrimWhitespace, false)
  values('update:diffOptions')[0].ignoreTrimWhitespace = true
  h.props.diffOptions = { ignoreTrimWhitespace: true }
  h.props.monacoOptions = { language: 'sql', theme: 'vs-light', fontSize: 12 }
  await Vue.nextTick()
  assert.equal(e.computedMonacoEditorOption.value.language, 'python')
  e.changeViewMode('edit')
  e.changeEditMode('diff')
  await Vue.nextTick()
  assert.equal(h.diff.options.ignoreTrimWhitespace, false)
  h.props.diffOptions.ignoreTrimWhitespace = false
  h.props.monacoOptions.fontSize = 24
  await Vue.nextTick()
  assert.equal(e.computedMonacoEditorOption.value.fontSize, 24)
  assert.equal(e.computedMonacoEditorOption.value.theme, 'vs-dark')
  h.props.previewSource = undefined
  await Vue.nextTick()
  h.cleanup()
})

test('readonly status follows each view and props; optional settings and repeated transitions are safe', async () => {
  const h = harness({ editMode: 'original', originalUri: '', modifiedUri: '' }, {}, { noInstance: true })
  await Vue.nextTick()
  const e = h.exposed
  assert.equal(e.currentReadOnly.value, true)
  e.changeEditMode('original')
  e.changeEditMode('modified')
  assert.equal(e.currentReadOnly.value, false)
  h.props.disabled = true
  assert.equal(e.currentReadOnly.value, true)
  h.props.disabled = false
  e.changeEditMode('diff')
  assert.equal(e.currentReadOnly.value, false)
  h.props.editableModified = false
  assert.equal(e.currentReadOnly.value, true)
  h.props.editableOriginal = true
  assert.equal(e.currentReadOnly.value, false)
  h.props.disabled = true
  assert.equal(e.currentReadOnly.value, true)
  h.props.previewSource = undefined
  h.props.monacoOptions = null
  h.props.diffOptions = null
  await Vue.nextTick()
  e.resetMonacoEditorOptions({ language: undefined, theme: undefined })
  await Vue.nextTick()
  assert.equal(e.previewLanguage.value, 'plaintext')
  h.updateDiff()
  h.pending(true)
  assert.equal(e.getLineChanges().length, 0)
  h.pending(false)
  e.commit()
  assert.ok(h.events.some(([name]) => name === 'confirm'))
  h.cleanup()
})

test('diff editor v-model writeback settles without duplicate events and reflects later parent changes', async () => {
  const h = harness({ editMode: 'original', previewSource: 'original' }, { preview() {} }, {
    onEvent([name, value], props) {
      if (name.startsWith('update:')) props[name.slice(7)] = value
    }
  })
  await Vue.nextTick()
  const e = h.exposed
  e.changeViewMode('preview')
  e.changePreviewSource('modified')
  e.changeDiffViewMode('inline')
  e.resetMonacoEditorOptions({ language: 'markdown', fontSize: 18, theme: 'vs-light' })
  e.resetMonacoDiffEditorOptions({ ignoreTrimWhitespace: false })
  e.fullscreenSwitch()
  await Vue.nextTick(); await Vue.nextTick()
  for (const [name, value] of [['viewMode', 'preview'], ['previewSource', 'modified'], ['diffViewMode', 'inline'], ['fullScreen', true]]) {
    assert.equal(h.props[name], value)
    assert.equal(h.events.filter(([event]) => event === `update:${name}`).length, 1)
  }
  assert.equal(h.props.monacoOptions.language, 'markdown')
  assert.equal(h.props.diffOptions.ignoreTrimWhitespace, false)
  h.props.viewMode = 'edit'
  h.props.editMode = 'diff'
  h.props.diffViewMode = 'side-by-side'
  h.props.previewSource = 'original'
  h.props.fullScreen = false
  h.props.monacoOptions.fontSize = 24
  h.props.diffOptions.ignoreTrimWhitespace = true
  await Vue.nextTick(); await Vue.nextTick()
  assert.equal(e.currentEditMode.value, 'diff')
  assert.equal(e.currentDiffViewMode.value, 'side-by-side')
  assert.equal(e.currentPreviewSource.value, 'original')
  assert.equal(e.isFullScreen.value, false)
  assert.equal(e.computedMonacoEditorOption.value.fontSize, 24)
  assert.equal(h.diff.options.ignoreTrimWhitespace, true)
  h.cleanup()
})

test('view and edit modes stay independent, honor new props and emit once with writeback', async () => {
  const h = harness({ viewMode: 'preview', editMode: 'original' }, { preview() {} })
  await Vue.nextTick()
  const e = h.exposed
  assert.equal('displayMode' in h.props, false)
  assert.equal('currentDisplayMode' in e, false)
  assert.equal('changeDisplayMode' in e, false)
  assert.equal(e.currentViewMode.value, 'preview')
  assert.equal(e.currentEditMode.value, 'original')
  e.changeEditMode('diff')
  assert.equal(e.currentViewMode.value, 'preview')
  e.changeViewMode('edit')
  assert.equal(e.currentEditMode.value, 'diff')
  h.props.editMode = 'modified'; h.props.viewMode = 'edit'; await Vue.nextTick()
  assert.equal(e.currentEditMode.value, 'modified')
  h.props.viewMode = 'preview'; await Vue.nextTick()
  h.props.editMode = 'original'; await Vue.nextTick()
  assert.equal(e.currentEditMode.value, 'original')
  assert.equal(e.currentViewMode.value, 'preview')
  h.props.editMode = 'diff'; h.props.viewMode = 'edit'; await Vue.nextTick()
  assert.equal(e.currentEditMode.value, 'diff')
  assert.equal(e.currentViewMode.value, 'edit')
  h.cleanup()
  const bound = harness({ viewMode: 'edit', editMode: 'diff' }, { preview() {} }, {
    onEvent([name, value], props) { if (name === 'update:viewMode' || name === 'update:editMode') props[name.slice(7)] = value }
  })
  bound.exposed.changeViewMode('preview'); bound.exposed.changeEditMode('original')
  await Vue.nextTick()
  assert.equal(bound.props.viewMode, 'preview')
  assert.equal(bound.props.editMode, 'original')
  assert.equal(bound.events.filter(([n]) => n === 'update:viewMode').length, 1)
  assert.equal(bound.events.filter(([n]) => n === 'update:editMode').length, 1)
  bound.cleanup()
})

test('independent state props and emits work with or without parent writeback', async () => {
  const states = [
    ['viewMode', 'currentViewMode', 'changeViewMode', 'edit', 'preview', 'view-mode-change'],
    ['editMode', 'currentEditMode', 'changeEditMode', 'diff', 'original', 'edit-mode-change'],
    ['previewSource', 'currentPreviewSource', 'changePreviewSource', 'modified', 'original', 'preview-source-change'],
    ['diffViewMode', 'currentDiffViewMode', 'changeDiffViewMode', 'side-by-side', 'inline', 'diff-view-mode-change'],
    ['fullScreen', 'isFullScreen', 'changeFullScreen', false, true, 'fullscreen-change']
  ]
  for (const writeback of [false, true]) {
    for (const [prop, current, method, initial, next, notification] of states) {
      const h = harness({ [prop]: initial }, { preview() {} }, {
        onEvent([name, value], props) { if (writeback && name === `update:${prop}`) props[prop] = value }
      })
      await Vue.nextTick()
      const e = h.exposed
      assert.equal(e[current].value, initial)
      e[method](next)
      assert.equal(e[current].value, next, `${prop} changes before parent render`)
      e[method](next)
      await Vue.nextTick()
      assert.equal(h.props[prop], writeback ? next : initial)
      assert.equal(h.events.filter(([name]) => name === `update:${prop}`).length, 1)
      assert.equal(h.events.filter(([name]) => name === notification).length, 1)
      h.props.disabled = true
      await Vue.nextTick()
      assert.equal(e[current].value, next, `${prop} survives an unrelated parent update`)
      // For a parent that ignored the event, first change its old prop to the local value.
      h.props[prop] = next
      await Vue.nextTick()
      h.props[prop] = initial
      await Vue.nextTick()
      assert.equal(e[current].value, initial, `${prop} follows a real external change`)
      assert.equal(h.events.filter(([name]) => name === `update:${prop}`).length, 2)
      h.cleanup()
    }
  }
})

test('preview, content selection and comparison layout retain independent state', async () => {
  const h = harness({ viewMode: 'preview', editMode: 'diff', previewSource: 'modified' }, { preview() {} })
  await Vue.nextTick()
  h.exposed.changeEditMode('original')
  h.exposed.changeDiffViewMode('inline')
  assert.equal(h.exposed.currentViewMode.value, 'preview')
  assert.equal(h.exposed.currentPreviewSource.value, 'modified')
  assert.equal(h.exposed.previewContent.value, 'new')
  h.exposed.changeViewMode('edit')
  assert.equal(h.exposed.currentEditMode.value, 'original')
  assert.equal(h.exposed.currentDiffViewMode.value, 'inline')
  assert.notEqual(h.exposed.getOriginalEditor(), null)
  assert.equal(h.exposed.getModifiedEditor(), null)
  h.cleanup()
})

test('content-change state follows drafts including an empty modified deletion and equal content', async () => {
  const { exposed, models, cleanup } = harness({ originalValue: 'original', modifiedValue: '' })
  try {
    assert.equal(exposed.hasContentChanges.value, true)
    models[1].setValue('original')
    assert.equal(exposed.hasContentChanges.value, false)
    models[0].setValue('changed original')
    assert.equal(exposed.hasContentChanges.value, true)
    models[0].setValue('')
    models[1].setValue('')
    assert.equal(exposed.hasContentChanges.value, false)
    await Vue.nextTick()
  } finally {
    cleanup()
  }
})
