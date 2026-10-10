import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLibraryLoader } from './helpers/load-library.mjs'

const monaco = { languages: { CompletionItemKind: { TypeParameter: 1, Operator: 2, Keyword: 3, Method: 4, Function: 5 }, CompletionItemInsertTextRule: { InsertAsSnippet: 4 } } }
const load = createLibraryLoader({ monaco, globals: { console: { log() {} } } })
const model = { getWordUntilPosition: () => ({ startColumn: 2, endColumn: 5 }) }
const position = { lineNumber: 3, column: 5 }

test('completion items preserve kinds, replacement ranges and supplied method documentation', () => {
  const { computedCompletionItems } = load('use.lib/monaco-editor-inti.ts')
  const result = computedCompletionItems(model, position, {
    types: ['CustomType'], operators: ['=>'], properties: ['CUSTOM'], objects: [],
    methods: ['plain', { label: 'method', documentation: 'Does work', parameters: [
      { name: 'value', type: 'string', description: 'Input' }, { name: 'flag', description: 'Option' }
    ] }, { label: 'optional' }]
  })
  assert.equal(result.suggestions.length, 6)
  assert.deepEqual(Array.from(result.suggestions, item => item.kind), [1, 2, 3, 5, 4, 4])
  assert.equal(result.suggestions[4].insertText, 'method(value:string, flag)')
  assert.match(result.suggestions[4].documentation.value, /Does work/)
  assert.match(result.suggestions[4].documentation.value, /value: Input/)
  assert.equal(result.suggestions[3].insertText, 'plain()')
  for (const item of result.suggestions) {
    assert.equal(item.range.startLineNumber, 3)
    assert.equal(item.range.startColumn, 2)
    assert.equal(item.range.endColumn, 5)
  }
})

for (const language of ['default', 'sql', 'python', 'groovy']) {
  test(`${language} completion provider supports empty configuration and merges supplied suggestions`, () => {
    const provider = load(`use.lib/languages/${language}.ts`).default
    const empty = provider().provideCompletionItems(model, position)
    assert.ok(Array.isArray(empty.suggestions))
    const extra = { types: ['ExtraType'], operators: ['EXTRA_OP'], properties: ['EXTRA_PROP'], methods: ['ExtraFunc'], objects: [] }
    const populated = provider(extra).provideCompletionItems(model, position)
    for (const name of ['ExtraType', 'EXTRA_OP', 'EXTRA_PROP', 'ExtraFunc']) {
      assert.ok(populated.suggestions.some(item => item.label === name))
    }
    assert.equal(populated.suggestions.length, empty.suggestions.length + 4)
    if (language === 'default' || language === 'sql') {
      const scoped = provider(extra, model)
      assert.equal(scoped.provideCompletionItems({ getWordUntilPosition() { throw new Error('Wrong model was accessed') } }, position).suggestions.length, 0)
      assert.ok(scoped.provideCompletionItems(model, position).suggestions.length > 0)
    }
  })
}
test('public entry exports renderers, controls, editors and the correct reminder provider', () => {
  const library = load('index.ts')
  for (const name of ['VmoMonacoEditor', 'VmoMonacoDiffEditor', 'VmoMonacoUi', 'VmoTextPreview', 'VmoCodePreview', 'VmoMarkdownPreview', 'VmoMonacoPreviewToggle']) {
    assert.equal(typeof library[name], 'object', name)
    assert.equal(typeof library[name].name, 'string', name)
  }
  for (const language of ['sql', 'python', 'groovy']) assert.equal(library.useReminderPlugin(language), load(`use.lib/languages/${language}.ts`).default)
  assert.equal(library.useReminderPlugin(), load('use.lib/languages/default.ts').default)
  assert.equal(load('components/vmo-monaco-editor/config/index.ts').vmoMonacoEditorDefaultOption.language, 'typescript')
})
