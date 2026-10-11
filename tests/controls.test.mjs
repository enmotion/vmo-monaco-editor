import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Vue from 'vue'
import { createLibraryLoader } from './helpers/load-library.mjs'

function fixture(targets = [], props = {}) {
  const injected = Vue.ref(targets)
  const load = createLibraryLoader({ vue: { ...Vue, inject: () => injected } })
  const events = []
  return {
    injected, events, load,
    control(name, overrides = {}) {
      return load(`components/vmo-monaco-ui/controls/${name}.vue`).default.setup({ ...props, ...overrides }, { emit: (...event) => events.push(event) })
    }
  }
}
function target() {
  return Vue.reactive({
    computedMonacoEditorOption: {}, calls: [], isFullScreen: false,
    resetMonacoEditorOptions(options) { this.calls.push(options); Object.assign(this.computedMonacoEditorOption, options) },
    fullscreenSwitch() { this.isFullScreen = !this.isFullScreen },
    commit() { this.calls.push('commit') }
  })
}
test('control target resolution handles injection, explicit overrides, empty targets and reactive replacement', () => {
  const a = target(), b = target(), f = fixture(a)
  const helper = f.load('components/vmo-monaco-ui/controls/use-monaco-control.ts')
  const props = Vue.reactive({ monaco: null })
  const control = helper.useVmoMonacoControl(props)
  assert.equal(control.monacos.value[0], a)
  props.monaco = [b, null]
  assert.deepEqual(control.monacos.value, [b])
  props.monaco = null
  f.injected.value = null
  assert.equal(control.monacos.value.length, 0)
  assert.equal(Object.keys(control.editorOption.value).length, 0)
  f.injected.value = [a, b]
  control.eachMonaco(editor => editor.commit())
  assert.equal(a.calls.length, 1)
  assert.equal(b.calls.length, 1)
})
test('line number and theme controls toggle every target and publish the resulting value', () => {
  for (const [name, method, property, first, second] of [
    ['line-numbers-toggle', 'toggleLineNumbers', 'lineNumbers', 'on', 'off'],
    ['theme-toggle', 'toggleTheme', 'theme', 'vs-light', 'vs-dark']
  ]) {
    const a = target(), b = target(), f = fixture([a, b])
    const control = f.control(name)
    control[method]()
    assert.equal(a.computedMonacoEditorOption[property], second)
    assert.equal(b.computedMonacoEditorOption[property], second)
    control[method]()
    assert.equal(a.computedMonacoEditorOption[property], first)
    assert.equal(f.events.at(-1)[1].monacoCount, 2)
    const controlled = f.control(name, { value: first, config: second, theme: second })
    controlled[method]()
    assert.equal(f.events.at(-1)[1].value, second)
    const configured = fixture([], { config: second }).control(name)
    configured[method]()
  }
})
test('minimap honors false controlled values and updates both models', () => {
  const a = target(), b = target(), f = fixture([a, b])
  const control = f.control('minimap-toggle')
  control.toggleMinimap()
  assert.equal(a.computedMonacoEditorOption.minimap.enabled, true)
  control.toggleMinimap()
  assert.equal(b.computedMonacoEditorOption.minimap.enabled, false)
  f.control('minimap-toggle', { value: false, config: true }).toggleMinimap()
  assert.equal(f.events.at(-1)[1].value, true)
  f.control('minimap-toggle', { config: true }).toggleMinimap()
  assert.equal(f.events.at(-1)[1].value, false)
})
test('font size exposes configuration and emits a numeric update for all targets', () => {
  const a = target(), f = fixture([a])
  const control = f.control('font-size-input')
  assert.equal(control.currentValue.value, 12)
  assert.equal(control.inputConfig.value.min, 6)
  control.handleInput({ target: { value: '18' } })
  assert.equal(control.currentValue.value, 18)
  assert.equal(f.events.find(([name]) => name === 'update:modelValue')[1], 18)
  const configured = f.control('font-size-input', { value: 20, modelValue: 22, config: { min: 8, max: 24, step: 2 } })
  assert.equal(configured.currentValue.value, 20)
  assert.equal(configured.inputConfig.value.step, 2)
  assert.equal(f.control('font-size-input', { modelValue: 22 }).currentValue.value, 22)
})
test('commit runs targets in reverse order without changing the target array', () => {
  const calls = [], targets = [1, 2].map(id => ({ commit: () => calls.push(id) }))
  const f = fixture(targets, { value: 'draft', config: true })
  f.control('commit-button').handleCommit()
  assert.deepEqual(calls, [2, 1])
  assert.equal(f.events[0][1].value, 'draft')
  f.injected.value = []
  f.control('commit-button').handleCommit()
  assert.equal(f.events.at(-1)[1].monacoCount, 0)
})
test('fullscreen control handles missing targets and retains value precedence', () => {
  const f = fixture()
  assert.doesNotThrow(() => f.control('fullscreen-toggle').toggleFullScreen())
  assert.equal(f.events.length, 0)
  const a = target()
  f.injected.value = [a]
  const control = f.control('fullscreen-toggle')
  control.toggleFullScreen()
  assert.equal(a.isFullScreen, true)
  assert.equal(f.events.at(-1)[1].value, true)
  assert.equal(f.control('fullscreen-toggle', { value: false, config: true }).currentValue.value, false)
  assert.equal(f.control('fullscreen-toggle', { config: false, isFullScreen: true }).currentValue.value, false)
  assert.equal(f.control('fullscreen-toggle', { isFullScreen: true }).currentValue.value, true)
})

test('language selector supports controlled and model values, plain lists and missing options', () => {
  const f = fixture()
  for (const [props, expected] of [
    [{ value: 'sql', modelValue: 'python' }, 'sql'], [{ modelValue: 'python' }, 'python'], [{}, '']
  ]) assert.equal(f.control('language-select', props).currentValue.value, expected)
  assert.equal(f.control('language-select', { languages: ['sql'] }).currentLanguages.value[0], 'sql')
  assert.equal(f.control('language-select', { config: { languages: ['python'] } }).currentLanguages.value[0], 'python')
})

test('review control dispatches actions only to diff targets and removes outside-click listeners', () => {
  const listeners = new Set(), cleanup = [], calls = [], events = []
  const injected = Vue.ref([])
  const load = createLibraryLoader({
    vue: { ...Vue, inject: () => injected, onBeforeUnmount: fn => cleanup.push(fn) },
    globals: { document: { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) } }
  })
  const component = load('components/vmo-monaco-ui/controls/diff-review.vue').default
  const props = { value: 'review', config: true }
  const control = component.setup(props, { emit: (...event) => events.push(event) })
  assert.equal(control.currentDisplayMode.value, 'diff')
  assert.equal(control.currentDiffViewMode.value, 'side-by-side')
  assert.equal(control.canReview.value, false)
  assert.equal(control.hasPreview.value, false)
  const make = hasPreview => ({
    hasPreview, getLineChanges: () => [{}], acceptAllChanges: () => calls.push('accept-all'),
    rejectAllChanges: () => calls.push('reject-all'), confirm: () => calls.push('confirm'),
    acceptChange: index => calls.push(['accept', index]), rejectChange: index => calls.push(['reject', index]),
    changeDisplayMode: mode => calls.push(['display', mode]), changeDiffViewMode: mode => calls.push(['layout', mode])
  })
  injected.value = [make(true), make(false), target(), null]
  assert.equal(control.lineChanges.value.length, 1)
  assert.equal(control.canReview.value, true)
  assert.equal(control.hasPreview.value, true)
  control.acceptAllChanges(); control.rejectAllChanges(); control.confirm()
  control.acceptChange(2); control.rejectChange(3)
  control.changeDisplayMode('original'); control.changeDisplayMode('preview'); control.changeDiffViewMode('inline')
  assert.equal(calls.filter(call => call === 'accept-all').length, 2)
  assert.equal(calls.filter(call => Array.isArray(call) && call[0] === 'display' && call[1] === 'preview').length, 1)
  assert.equal(events.at(-1)[1].monacoCount, 2)
  assert.equal(events.find(([name]) => name === 'accept-change')[1].index, 2)
  control.togglePanel()
  assert.equal(listeners.size, 1)
  control.ReviewActionsRef.value = { contains: () => true }
  Array.from(listeners)[0]({ target: {} })
  assert.equal(control.isOpen.value, true)
  control.ReviewActionsRef.value = { contains: () => false }
  Array.from(listeners)[0]({ target: {} })
  assert.equal(control.isOpen.value, false)
  assert.equal(listeners.size, 0)
  control.togglePanel(); control.togglePanel()
  assert.equal(listeners.size, 0)
  control.togglePanel(); cleanup.forEach(fn => fn())
  assert.equal(listeners.size, 0)
})

test('all setting controls retain local changes without parent writeback and accept real external changes', () => {
  const cases = [
    ['theme-toggle', 'currentTheme', 'theme', 'vs-light', 'vs-dark', c => c.toggleTheme()],
    ['line-numbers-toggle', 'currentValue', 'lineNumbers', 'on', 'off', c => c.toggleLineNumbers()],
    ['minimap-toggle', 'currentValue', 'minimap', false, true, c => c.toggleMinimap()],
    ['font-size-input', 'currentValue', 'fontSize', 12, 18, c => c.handleInput({ target: { value: '18' } })],
    ['language-select', 'currentValue', 'language', 'sql', 'python', c => c.handleChange({ target: { value: 'python' } })]
  ]
  for (const [name, state, property, initial, local, act] of cases) {
    const a = target(), events = [], scope = Vue.effectScope()
    a.changeLanguage = language => a.resetMonacoEditorOptions({ language })
    const load = createLibraryLoader({ vue: { ...Vue, inject: () => Vue.ref(a) } })
    const props = Vue.reactive({ value: initial, unrelated: 0 })
    const control = scope.run(() => load(`components/vmo-monaco-ui/controls/${name}.vue`).default.setup(props, { emit: (...e) => events.push(e) }))
    const actual = () => property === 'minimap' ? a.computedMonacoEditorOption.minimap.enabled : a.computedMonacoEditorOption[property]
    assert.equal(actual(), initial, `${name}: initialize target from props`)
    act(control)
    assert.equal(props.value, initial)
    assert.equal(control[state].value, local)
    assert.equal(actual(), local)
    assert.ok(events.some(([event, value]) => event === 'update:value' && value === local))
    props.unrelated++
    props.value = initial
    assert.equal(control[state].value, local, `${name}: unchanged props must retain local state`)
    const external = typeof initial === 'boolean' ? local : name === 'font-size-input' ? 24 : name === 'language-select' ? 'json' : local
    props.value = external
    assert.equal(control[state].value, external)
    props.value = initial
    assert.equal(control[state].value, initial)
    assert.equal(actual(), initial)
    const before = events.length
    props.value = undefined
    assert.equal(control[state].value, initial)
    assert.equal(events.length, before, 'external sync does not echo control interaction events')
    a.resetMonacoEditorOptions(property === 'minimap' ? { minimap: { enabled: local } } : { [property]: local })
    assert.equal(control[state].value, local, 'direct editor changes are reflected')
    scope.stop()
  }
})

test('control aliases and local state work without an editor', () => {
  const scope = Vue.effectScope(), load = createLibraryLoader({ vue: { ...Vue, inject: () => Vue.ref(null) } })
  scope.run(() => {
    const props = Vue.reactive({ modelValue: 14 })
    const font = load('components/vmo-monaco-ui/controls/font-size-input.vue').default.setup(props, { emit() {} })
    font.handleInput({ target: { value: '20' } })
    assert.equal(font.currentValue.value, 20)
    props.modelValue = 16
    assert.equal(font.currentValue.value, 16)
    const languageProps = Vue.reactive({ modelValue: 'sql' })
    const language = load('components/vmo-monaco-ui/controls/language-select.vue').default.setup(languageProps, { emit() {} })
    language.handleChange({ target: { value: 'json' } })
    assert.equal(language.currentValue.value, 'json')
    languageProps.modelValue = 'python'
    assert.equal(language.currentValue.value, 'python')
    const themeProps = Vue.reactive({ theme: 'vs-light' })
    const theme = load('components/vmo-monaco-ui/controls/theme-toggle.vue').default.setup(themeProps, { emit() {} })
    theme.toggleTheme(); theme.toggleTheme()
    assert.equal(theme.currentTheme.value, 'vs-light')
    themeProps.theme = 'vs-dark'
    assert.equal(theme.currentTheme.value, 'vs-dark')
  })
  scope.stop()
})

test('fullscreen props and internal actions set the actual target state', () => {
  const a = target(), scope = Vue.effectScope(), load = createLibraryLoader({ vue: { ...Vue, inject: () => Vue.ref(a) } })
  const props = Vue.reactive({ value: true })
  const events = []
  const control = scope.run(() => load('components/vmo-monaco-ui/controls/fullscreen-toggle.vue').default.setup(props, { emit: (...e) => events.push(e) }))
  assert.equal(a.isFullScreen, true)
  control.toggleFullScreen()
  assert.equal(control.currentValue.value, false)
  assert.equal(a.isFullScreen, false)
  control.toggleFullScreen()
  assert.equal(a.isFullScreen, true)
  props.value = false
  assert.equal(a.isFullScreen, false)
  props.value = true
  assert.equal(a.isFullScreen, true)
  props.value = undefined
  a.fullscreenSwitch()
  assert.equal(control.currentValue.value, false)
  assert.equal(events.filter(([e]) => e === 'update:value').length, 2)
  scope.stop()
})
