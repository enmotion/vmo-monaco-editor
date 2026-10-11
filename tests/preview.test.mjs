import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transpileModule, runInNewContext } from './helpers/source-runtime.mjs'
import ts from 'typescript'
import * as Vue from 'vue'
import { compile } from '@vue/compiler-dom'
import { renderToString } from '@vue/server-renderer'
import MarkdownIt from 'markdown-it'
import postcss from 'postcss'

test('preview icon CSS requires iconfont and cannot inject a glyph into preview containers', () => {
  const css = fs.readFileSync(new URL('../assets/iconfont/iconfont.css', import.meta.url), 'utf8')
  const selectors = []
  postcss.parse(css).walkRules(rule => {
    if (rule.selector.includes('.vmo-preview')) selectors.push(...rule.selectors)
  })
  assert.ok(selectors.length > 0)
  for (const selector of selectors) assert.match(selector, /^\.iconfont\.vmo-preview::?before$/)
})

function component(name, Monaco = {}) {
  const source = fs.readFileSync(new URL(`../components/vmo-preview/vmo-${name}-preview.vue`, import.meta.url), 'utf8')
  const context = { exports: {}, require(name) {
    if (name === 'vue') return Vue
    if (name === 'monaco-editor') return Monaco
    if (name === 'markdown-it') return MarkdownIt
    if (name === './preview.css') return {}
    throw new Error(name)
  } }
  runInNewContext(transpileModule(source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1], {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  }).outputText, context)
  const result = context.exports.default
  result.render = new Function('Vue', compile(source.match(/<template>([\s\S]*?)<\/template>/)[1], { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  return result
}
function mount(component, initialProps) {
  const root = { children: [] }
  const renderer = Vue.createRenderer({
    createElement: tag => ({ tag, children: [], props: {} }),
    createText: text => ({ text }), createComment: text => ({ text }),
    insert(node, parent) { parent.children.push(node); node.parent = parent },
    remove(node) { node.parent.children.splice(node.parent.children.indexOf(node), 1) },
    setText(node, text) { node.text = text }, setElementText(node, text) { node.text = text },
    parentNode: node => node.parent, nextSibling: () => null,
    patchProp(node, key, _, value) { node.props[key] = value }
  })
  const props = Vue.reactive(initialProps)
  const app = renderer.createApp({ render: () => Vue.h(component, props) })
  app.mount(root)
  return { props, app, node: root.children[0] }
}

test('text preview escapes HTML, preserves text and forwards class/style', async () => {
  const html = await renderToString(Vue.h(component('text'), {
    content: '<img src=x onerror=alert(1)>\nnext', theme: 'vs-dark', class: 'custom', style: { color: 'red' }
  }))
  assert.match(html, /&lt;img/)
  assert.doesNotMatch(html, /<img/)
  assert.match(html, /\nnext/)
  assert.match(html, /custom/)
  assert.match(html, /color:red/)
  assert.match(html, /data-theme="vs-dark"/)
})
test('text content and unstyled state react to changes', async () => {
  const h = mount(component('text'), { content: 'before', unstyled: false })
  h.props.content = 'after'; h.props.unstyled = true
  await Vue.nextTick()
  assert.equal(h.node.text, 'after')
  assert.doesNotMatch(h.node.props.class, /is-styled/)
  h.app.unmount()
})
test('markdown renders headings, tables, lists, quotes and escaped code', async () => {
  const html = await renderToString(Vue.h(component('markdown'), {
    content: '# Title\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- item\n\n> quote\n\n```html\n<script>test</script>\n```'
  }))
  for (const tag of ['h1', 'table', 'ul', 'blockquote', 'pre']) assert.match(html, new RegExp(`<${tag}[ >]`))
  assert.match(html, /&lt;script&gt;/)
})
test('default markdown escapes raw HTML and rejects executable links', async () => {
  const html = await renderToString(Vue.h(component('markdown'), {
    content: '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[click](javascript:alert(1))'
  }))
  assert.doesNotMatch(html, /<script|<img|href="javascript:/)
  assert.match(html, /&lt;script&gt;/)
})
test('markdown updates content, renderer and theme without recreating the component', async () => {
  const h = mount(component('markdown'), { content: '# Before', theme: 'vs-light' })
  assert.match(h.node.props.innerHTML, /<h1>Before/)
  h.props.content = '**After**'; h.props.theme = 'vs-dark'
  await Vue.nextTick()
  assert.match(h.node.props.innerHTML, /<strong>After/)
  assert.equal(h.node.props['data-theme'], 'vs-dark')
  h.props.render = content => `<article>${content.length}</article>`
  h.props.unstyled = true
  await Vue.nextTick()
  assert.equal(h.node.props.innerHTML, '<article>9</article>')
  assert.doesNotMatch(h.node.props.class, /is-styled/)
  h.props.render = undefined
  await Vue.nextTick()
  assert.match(h.node.props.innerHTML, /<strong>After/)
  h.app.unmount()
})
function monacoDouble(fail = false) {
  const models = [], editors = [], themes = []
  return { models, editors, themes, api: { editor: {
    createModel(content, language) {
      const model = { value: content, language, disposed: false, getValue() { return this.value }, setValue(value) { this.value = value }, dispose() { this.disposed = true } }
      models.push(model); return model
    },
    create(container, options) {
      if (fail) throw new Error('create failed')
      const editor = { container, options, disposed: false, updateOptions(options) {
        assert.equal('model' in options, false, 'Monaco updateOptions must never receive a cyclic model')
        assert.equal('theme' in options, false)
        assert.equal('language' in options, false)
        this.options = options
      }, dispose() { this.disposed = true } }
      editors.push(editor); return editor
    },
    setTheme(theme) { themes.push(theme) }, setModelLanguage(model, language) { model.language = language }
  } } }
}
test('code stays readonly, updates its owned model and options, and disposes resources', async () => {
  const m = monacoDouble()
  const h = mount(component('code', m.api), {
    content: 'const n = 1', language: 'javascript', theme: 'vs-light',
    monacoOptions: { readOnly: false, domReadOnly: false, model: {}, fontSize: 18 }
  })
  assert.equal(m.editors[0].options.readOnly, true)
  assert.equal(m.editors[0].options.domReadOnly, true)
  assert.equal(m.editors[0].options.model, m.models[0])
  assert.equal(m.editors[0].options.minimap.enabled, false)
  h.props.content = 'print(1)'; h.props.language = 'python'; h.props.theme = 'vs-dark'
  h.props.monacoOptions.fontSize = 20
  await Vue.nextTick()
  assert.equal(m.models[0].value, 'print(1)')
  assert.equal(m.models[0].language, 'python')
  assert.deepEqual(m.themes, ['vs-dark'])
  assert.equal(m.editors[0].options.fontSize, 20)
  assert.equal(m.editors[0].options.readOnly, true)
  assert.equal(m.editors.length, 1)
  h.app.unmount()
  assert.equal(m.editors[0].disposed, true)
  assert.equal(m.models[0].disposed, true)
})
test('code releases the owned model if editor creation fails', () => {
  const m = monacoDouble(true)
  const originalWarn = console.warn
  console.warn = () => {}
  try { assert.throws(() => mount(component('code', m.api), { content: '' }), /create failed/) }
  finally { console.warn = originalWarn }
  assert.equal(m.models[0].disposed, true)
})
