import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Vue from 'vue'
import { createLibraryLoader } from './helpers/load-library.mjs'

test('toolbar provides its target reactively and normalizes flags, enums and per-control configuration', () => {
  const provided = []
  const component = createLibraryLoader({ vue: { ...Vue, provide: (...args) => provided.push(args) } })('components/vmo-monaco-ui/vmo-monaco-ui.vue').default
  const props = Vue.reactive({ monaco: null, config: component.props.config.default() })
  const ui = component.setup(props, {})
  assert.equal(ui.theme.value, 'vs-light')
  assert.equal(ui.monacoNeedConfirm.value, false)
  assert.equal(ui.languageVisible.value, true)
  assert.equal(ui.fontSizeControlConfig.value, undefined)
  assert.equal(ui.themeControlConfig.value, undefined)
  assert.equal(ui.lineNumbersControlConfig.value, undefined)
  assert.equal(ui.reviewActionsControlConfig.value, false)
  props.monaco = { computedMonacoEditorOption: { theme: 'vs-dark' }, needConfirm: true }
  assert.equal(provided[0][1].value, props.monaco)
  assert.equal(ui.theme.value, 'vs-dark')
  assert.equal(ui.monacoNeedConfirm.value, true)
  props.config = { fontSize: { min: 10 }, theme: 'vs-dark', lineNumbers: 'off', reviewActions: true, language: { languages: ['sql', 'python'] } }
  assert.equal(ui.fontSizeControlConfig.value.min, 10)
  assert.equal(ui.themeControlConfig.value, 'vs-dark')
  assert.equal(ui.lineNumbersControlConfig.value, 'off')
  assert.equal(ui.languageControlConfig.value.languages[1], 'python')
  assert.equal(ui.reviewActionsControlConfig.value, true)
  props.monaco = [null, { needConfirm: false }]
  props.config = {}
  assert.equal(ui.monacoNeedConfirm.value, false)
  assert.equal(ui.languageControlConfig.value, undefined)
  assert.equal(ui.languageVisible.value, false)
  props.config = { language: false, languages: ['sql', 'python'] }
  assert.equal(ui.languageVisible.value, false)
})

test('toolbar separates preview source from editor view and reflects current settings', () => {
  const component = createLibraryLoader({ vue: { ...Vue, provide() {} } })('components/vmo-monaco-ui/vmo-monaco-ui.vue').default
  const calls = []
  const editor = Vue.reactive({
    computedMonacoEditorOption: { language: 'markdown', fontSize: 16, theme: 'vs-dark' },
    currentDisplayMode: 'original', currentPreviewSource: 'original', currentReadOnly: true,
    currentDiffViewMode: 'side-by-side',
    changeDisplayMode(mode) { calls.push(['view', mode]); this.currentDisplayMode = mode },
    changePreviewSource(source) { calls.push(['source', source]); this.currentPreviewSource = source }
  })
  const props = Vue.reactive({ monaco: editor, config: {} })
  const ui = component.setup(props, {})
  assert.equal(ui.currentContentMode.value, 'original')
  assert.equal(ui.interactionLabel.value, '只读')
  editor.currentDisplayMode = 'preview'
  ui.changeContentMode('modified')
  assert.deepEqual(calls.pop(), ['source', 'modified'])
  assert.equal(ui.currentContentMode.value, 'modified')
  assert.equal(ui.interactionLabel.value, '预览')
  assert.equal(editor.currentDisplayMode, 'preview')
  ui.changeContentMode('diff')
  assert.deepEqual(calls.pop(), ['view', 'diff'])
  assert.equal(ui.currentContentMode.value, 'diff')
  assert.equal(ui.diffViewLabel.value, '并排')
  editor.currentDiffViewMode = 'inline'
  editor.currentReadOnly = false
  assert.equal(ui.diffViewLabel.value, '行内')
  assert.equal(ui.interactionLabel.value, '编辑')
  editor.computedMonacoEditorOption.fontSize = 20
  assert.equal(ui.editorOption.value.fontSize, 20)
  props.monaco = { computedMonacoEditorOption: { readOnly: true, language: 'sql' } }
  assert.equal(ui.diffMonacos.value.length, 0)
  assert.equal(ui.currentContentMode.value, 'original')
  assert.equal(ui.interactionLabel.value, '只读')
  assert.equal(ui.editorOption.value.language, 'sql')
})

test('toolbar changes editMode independently while both editor kinds display preview status', () => {
  const component = createLibraryLoader({ vue: { ...Vue, provide() {} } })('components/vmo-monaco-ui/vmo-monaco-ui.vue').default
  const target = Vue.reactive({ currentViewMode: 'preview', currentEditMode: 'diff', currentDisplayMode: 'preview',
    changeDisplayMode() {}, changeEditMode(mode) { this.currentEditMode = mode } })
  const ui = component.setup(Vue.reactive({ monaco: target, config: {} }), {})
  ui.changeContentMode('original')
  assert.equal(ui.currentContentMode.value, 'original')
  assert.equal(ui.interactionLabel.value, '预览')
  target.currentViewMode = 'edit'; target.currentDisplayMode = 'original'
  assert.equal(ui.isPreview.value, false)
  const ordinary = component.setup({ monaco: { currentViewMode: 'preview' }, config: {} }, {})
  assert.equal(ordinary.interactionLabel.value, '预览')
})
