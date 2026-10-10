import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transpileModule, runInNewContext } from './helpers/source-runtime.mjs'
import ts from 'typescript'
import * as Vue from 'vue'
import { parse } from '@vue/compiler-sfc'
import { compile } from '@vue/compiler-dom'
import { renderToString } from '@vue/server-renderer'

function load(file, resolve) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const context = { exports: {}, require: name => name === 'vue' ? Vue : resolve(name) }
  runInNewContext(transpileModule(descriptor.script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, context)
  const component = context.exports.default
  component.render = new Function('Vue', compile(descriptor.template.content, { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  return component
}
const placeholder = Vue.defineComponent({ render: () => null })
const listControl = Vue.defineComponent({
  props: ['config'], setup: props => () => Vue.h('select', props.config.languages.map(value => Vue.h('option', { value }, value)))
})
const ui = load('components/vmo-monaco-ui/vmo-monaco-ui.vue', name => {
  if (name === './controls/use-monaco-control') return { VMO_MONACO_EDITOR_KEY: Symbol() }
  if (name === './controls/language-select.vue') return listControl
  if (name.startsWith('./controls/')) return placeholder
  throw new Error(name)
})
test('toolbar supports shorthand and nested language lists with an explicit visibility override', async () => {
  for (const config of [{ languages: ['sql', 'javascript'] }, { language: { languages: ['sql', 'javascript'] } }]) {
    const html = await renderToString(Vue.h(ui, { config }))
    assert.match(html, /<select/)
    assert.match(html, /value="javascript"/)
  }
  for (const config of [{ language: false, languages: ['sql', 'javascript'] }, { languages: ['sql'] }]) {
    assert.doesNotMatch(await renderToString(Vue.h(ui, { config })), /<select/)
  }
})
test('language select displays the current model language outside the configured choices', async () => {
  const target = Vue.reactive({ computedMonacoEditorOption: { language: 'plaintext' }, changeLanguage(language) { this.computedMonacoEditorOption.language = language } })
  const events = []
  const component = load('components/vmo-monaco-ui/controls/language-select.vue', () => ({
    createVmoMonacoControlProps: () => ({ config: Object }),
    useVmoMonacoControl: () => ({ monacos: Vue.ref([target]), editorOption: Vue.computed(() => target.computedMonacoEditorOption), eachMonaco: fn => fn(target) })
  }))
  const html = await renderToString(Vue.h(component, { config: { languages: ['sql', 'javascript'] } }))
  assert.match(html, /value="plaintext" disabled/)
  const control = component.setup({ config: { languages: ['sql', 'javascript'] } }, { emit: (...event) => events.push(event) })
  control.handleChange({ target: { value: 'javascript' } })
  assert.equal(target.computedMonacoEditorOption.language, 'javascript')
  assert.equal(control.currentValue.value, 'javascript')
  assert.ok(events.some(([name, value]) => name === 'change' && value === 'javascript'))
})
