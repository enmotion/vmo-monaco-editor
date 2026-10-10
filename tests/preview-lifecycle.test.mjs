import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Vue from 'vue'
import { createLibraryLoader } from './helpers/load-library.mjs'

test('code preview initializes with the latest pre-mount props and avoids redundant model writes', async () => {
  const mounted = [], unmounted = [], stops = [], writes = [], themes = []
  let model, editor
  const load = createLibraryLoader({
    vue: { ...Vue, onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => unmounted.push(fn), watch(...args) { const stop = Vue.watch(...args); stops.push(stop); return stop } },
    monaco: { editor: {
      createModel(value, language) { model = { value, language, disposed: false, getValue() { return this.value }, setValue(value) { writes.push(value); this.value = value }, dispose() { this.disposed = true } }; return model },
      create() { editor = { disposed: false, updateOptions(options) { this.options = options }, dispose() { this.disposed = true } }; return editor },
      setModelLanguage(model, language) { model.language = language }, setTheme: theme => themes.push(theme)
    } }
  })
  const component = load('components/vmo-preview/vmo-code-preview.vue').default
  const props = Vue.reactive({ content: 'before', language: 'sql', theme: 'vs-light', monacoOptions: component.props.monacoOptions.default() })
  const instance = component.setup(props)
  props.content = 'latest'; props.language = 'javascript'; props.theme = 'vs-dark'; props.monacoOptions = { fontSize: 16 }
  await Vue.nextTick()
  mounted[0]()
  assert.equal(model, undefined)
  instance.container.value = {}
  mounted[0]()
  assert.equal(model.getValue(), 'latest')
  assert.equal(model.language, 'javascript')
  model.value = 'already synchronized'
  props.content = 'already synchronized'
  await Vue.nextTick()
  assert.equal(writes.length, 0)
  props.monacoOptions = { fontSize: 18 }
  props.language = 'python'; props.theme = 'vs-light'
  await Vue.nextTick()
  assert.equal(editor.options.fontSize, 18)
  assert.equal(editor.options.readOnly, true)
  assert.equal(model.language, 'python')
  assert.equal(themes[0], 'vs-light')
  unmounted.forEach(fn => fn()); stops.forEach(stop => stop())
  assert.equal(model.disposed, true)
  assert.equal(editor.disposed, true)
})
