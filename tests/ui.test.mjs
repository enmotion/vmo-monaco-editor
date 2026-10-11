import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Vue from 'vue'
import fs from 'node:fs'
import { compile } from '@vue/compiler-dom'
import { renderToString } from '@vue/server-renderer'
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

function renderableToolbar() {
  const component = createLibraryLoader()('components/vmo-monaco-ui/vmo-monaco-ui.vue').default
  function render(file) {
    const template = fs.readFileSync(new URL(file, import.meta.url), 'utf8').match(/<template>([\s\S]*)<\/template>/)[1]
    return new Function('Vue', compile(template, { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  }
  component.render = render('../components/vmo-monaco-ui/vmo-monaco-ui.vue')
  component.components.PreviewToggle.render = render('../components/vmo-monaco-ui/controls/preview-toggle.vue')
  return component
}

test('default toolbar has one row, an icon preview control and no duplicate state text', async () => {
  const target = { hasPreview: true, currentViewMode: 'preview', needConfirm: false,
    computedMonacoEditorOption: { language: 'sql', fontSize: 16, theme: 'vs-dark' }, changeViewMode() {} }
  const html = await renderToString(Vue.h(renderableToolbar(), { title: 'Editor', monaco: target, config: {} }))
  assert.match(html, /class="bar"/)
  assert.match(html, /vmo-preview-toggle/)
  assert.match(html, /aria-pressed="true"/)
  assert.match(html, /aria-label="返回编辑器"/)
  assert.doesNotMatch(html, /editor-state|state-settings|content-modes|预览来源：|待确认/)
  assert.doesNotMatch(html, />(?:语言|字号|主题|模式|正文|预览|返回编辑器)</)
  const hidden = await renderToString(Vue.h(renderableToolbar(), { monaco: target, config: { preview: false } }))
  assert.doesNotMatch(hidden, /vmo-preview-toggle/)
})

test('custom toolbar slot fully replaces default controls without appending UI', async () => {
  const html = await renderToString(Vue.h(renderableToolbar(), {
    monaco: { hasPreview: true, currentViewMode: 'preview', changeViewMode() {} }, config: {}
  }, { default: () => Vue.h('button', { class: 'custom-toolbar' }, 'Custom') }))
  assert.match(html, /custom-toolbar/)
  assert.doesNotMatch(html, /editor-state|vmo-preview-toggle|state-settings|content-modes/)
})

test('UI default slot receives the effective first target viewMode with an edit fallback', async () => {
  const target = Vue.reactive({ currentViewMode: 'edit', computedMonacoEditorOption: {} })
  const component = renderableToolbar()
  const seen = []
  async function render(monaco) {
    return renderToString(Vue.h(component, { monaco, config: {} }, {
      default: ({ viewMode }) => { seen.push(viewMode); return Vue.h('span', { 'data-view-mode': viewMode }, 'Custom') }
    }))
  }
  assert.match(await render(null), /data-view-mode="edit"/)
  assert.match(await render(target), /data-view-mode="edit"/)
  target.currentViewMode = 'preview'
  assert.match(await render(target), /data-view-mode="preview"/)
  assert.match(await render([target, { currentViewMode: 'edit' }]), /data-view-mode="preview"/)
  assert.deepEqual(seen, ['edit', 'edit', 'preview', 'preview'])
})
