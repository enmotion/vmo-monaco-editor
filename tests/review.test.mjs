import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the real helper with a text-model double; no browser or Monaco workers required.
class Range {
  constructor(sl, sc, el, ec) { Object.assign(this, { sl, sc, el, ec }) }
}
const context = { exports: {}, require: name => name === 'ramda' ? { isNil: x => x == null } : { Range } }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../components/vmo-monaco-diff-editor/review.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText, context)
function model(initial, eol = '\n') {
  let value = initial
  const history = []
  return {
    getValue: () => value,
    getEOL: () => eol,
    getPositionAt(offset) {
      const prefix = value.slice(0, offset).split(eol)
      return { lineNumber: prefix.length, column: prefix.at(-1).length + 1 }
    },
    offset(line, column) { return value.split(eol).slice(0, line - 1).reduce((sum, text) => sum + text.length + eol.length, 0) + column - 1 },
    pushStackElement() {},
    pushEditOperations(_, edits) {
      history.push(value)
      for (const { range, text } of edits) value = value.slice(0, this.offset(range.sl, range.sc)) + text + value.slice(this.offset(range.el, range.ec))
    },
    undo() { value = history.pop() }
  }
}
const cases = [
  ['insert middle', 'a\nb', 'a\nx\nb', [1, 0, 2, 2]],
  ['insert beginning', 'a\nb', 'x\na\nb', [0, 0, 1, 1]],
  ['insert end', 'a\nb', 'a\nb\nx', [2, 0, 3, 3]],
  ['delete middle', 'a\nx\nb', 'a\nb', [2, 2, 1, 0]],
  ['delete beginning', 'x\na\nb', 'a\nb', [1, 1, 0, 0]],
  ['delete end', 'a\nb\nx', 'a\nb', [3, 3, 2, 0]],
  ['replace multiple', 'a\nx\ny\nb', 'a\nz\nb', [2, 3, 2, 2]],
  ['empty document', '', 'x', [1, 1, 1, 1]],
  ['clear document', 'x', '', [1, 1, 1, 1]],
  ['trailing newline', 'a', 'a\n', [1, 0, 2, 2]],
  ['blank lines', 'a\n\n\nb', 'a\nb', [2, 3, 1, 0]],
  ['unicode', 'a\n旧😀\nb', 'a\n新😀\nb', [2, 2, 2, 2]]
]
for (const [name, original, modified, coordinates] of cases) {
  for (const action of ['accept', 'reject']) {
    for (const eol of ['\n', '\r\n']) {
      test(`${name}: ${action}, ${JSON.stringify(eol)}`, () => {
        const originalModel = model(original.replaceAll('\n', eol), eol)
        const modifiedModel = model(modified.replaceAll('\n', eol), eol)
        const [originalStartLineNumber, originalEndLineNumber, modifiedStartLineNumber, modifiedEndLineNumber] = coordinates
        const lineChange = { originalStartLineNumber, originalEndLineNumber, modifiedStartLineNumber, modifiedEndLineNumber }
        const target = action === 'accept' ? originalModel : modifiedModel
        const source = action === 'accept' ? modifiedModel : originalModel
        const before = target.getValue()
        context.exports.applyLineChange({ lineChanges: [lineChange], originalModel, modifiedModel }, 0, action)
        assert.equal(target.getValue(), source.getValue())
        target.undo()
        assert.equal(target.getValue(), before)
      })
    }
  }
}
test('invalid index leaves models unchanged', () => {
  const originalModel = model('a'), modifiedModel = model('b')
  assert.equal(context.exports.applyLineChange({ lineChanges: [], originalModel, modifiedModel }, 3, 'accept'), null)
  assert.equal(originalModel.getValue(), 'a')
})
