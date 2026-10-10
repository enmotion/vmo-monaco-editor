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
