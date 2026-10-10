import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLibraryLoader } from './helpers/load-library.mjs'

class Range {
  constructor(startLineNumber, startColumn, endLineNumber, endColumn) { Object.assign(this, { startLineNumber, startColumn, endLineNumber, endColumn }) }
}
const review = createLibraryLoader({ monaco: { Range } })('components/vmo-monaco-diff-editor/review.ts')
const model = { getLineCount: () => 20, getLineMaxColumn: line => line + 2 }
const change = (os, oe, ms, me, chars) => ({ originalStartLineNumber: os, originalEndLineNumber: oe, modifiedStartLineNumber: ms, modifiedEndLineNumber: me, charChanges: chars })
const list = [change(2, 4, 6, 7, [change(8, 9, 10, 11)]), change(12, 0, 13, 14), change(15, 16, 14, 0)]
const array = result => Array.from(result)

test('review ranges clamp boundaries and collect character changes without duplicate lines', () => {
  assert.deepEqual(array(review.getReviewActionLineNumbers(null, 1, 3)), [])
  assert.deepEqual(array(review.getReviewActionLineNumbers(model, 0, 0)), [])
  assert.deepEqual(array(review.getReviewActionLineNumbers(model, 0, 2)), [2])
  assert.deepEqual(array(review.getReviewActionLineNumbers(model, 19, 99)), [19, 20])
  assert.deepEqual(array(review.getReviewActionLineNumbers(model, -2, 2)), [1, 2])
  assert.deepEqual(array(review.getReviewActionLineNumbers(model, 3, 0)), [3])
  assert.equal(review.getReviewActionLineNumber(null, 1, 1), 0)
  assert.equal(review.getReviewActionLineNumber(model, 3, 4), 3)
  assert.deepEqual(array(review.getLineChangeOriginalLineNumbers(list[0], model)), [2, 3, 4, 8, 9])
  assert.deepEqual(array(review.getLineChangeModifiedLineNumbers(list[0], model)), [6, 7, 10, 11])
  assert.deepEqual(array(review.uniqueLineNumbers([0, -1, 2, 2, 3])), [2, 3])
  assert.equal(review.getLineChangeRange(model, 0, 0).startLineNumber, 1)
  assert.equal(review.getLineChangeRange(model, 0, 4).startLineNumber, 4)
  const range = review.getLineChangeRange(model, -2, 99)
  assert.equal(range.startLineNumber, 1)
  assert.equal(range.endLineNumber, 20)
  assert.equal(range.endColumn, 22)
})
test('action maps cover replacement, insertion, deletion and absent models', () => {
  const changes = [change(2, 3, 4, 5), change(0, 0, 6, 7), change(8, 9, 0, 0), change(0, 0, 0, 0)]
  const maps = review.createReviewActionMaps(changes, model, model)
  assert.equal(maps.modifiedAcceptMap[4], 0)
  assert.equal(maps.modifiedAcceptMap[7], 1)
  assert.equal(maps.originalAcceptMap[9], 2)
  assert.equal(maps.originalRejectMap[3], 0)
  assert.equal(maps.modifiedRejectMap[6], 1)
  assert.equal(maps.modifiedRejectMap[8], 2)
  assert.equal(Object.keys(review.createReviewActionMaps(changes, null, null).modifiedAcceptMap).length, 0)
})
test('native action discovery recognizes signs, icon classes and nested nodes within the root', () => {
  const root = { textContent: '+', className: '' }
  for (const [textContent, className, expected] of [
    ['+', '', 'accept'], ['-', '', 'reject'], ['', 'line-insert', 'accept'], ['', 'line-delete', 'reject'],
    ['', 'char-insert', 'accept'], ['', 'char-delete', 'reject'], ['', 'insert-sign', 'accept'],
    ['', 'delete-sign', 'reject'], ['', 'remove', 'reject'], ['', 'line-insert add', 'accept']
  ]) {
    const parent = { textContent, className, parentElement: root }
    const target = { textContent: '', className: '', parentElement: parent }
    assert.equal(review.findNativeDiffActionNode(target, root), parent)
    assert.equal(review.getNativeDiffAction({ event: { browserEvent: { target } } }, root), expected)
  }
  for (const target of [null, root, { parentElement: null }]) {
    assert.equal(review.getNativeDiffAction({ event: { browserEvent: { target } } }, root), null)
  }
})
test('side line lookup supports character changes and rejects missing or out-of-range locations', () => {
  assert.equal(review.findNearestLineChangeIndex(list, 3, 'original'), 0)
  assert.equal(review.findNearestLineChangeIndex(list, 6, 'modified'), 0)
  assert.equal(review.findNearestLineChangeIndex(list, 3, 'modified', 'reject'), 0)
  assert.equal(review.findNearestLineChangeIndex(list, 3, 'modified', 'accept'), undefined)
  assert.equal(review.findNearestLineChangeIndex(list, 99, 'original'), undefined)
  for (const [line, side, expected] of [[8, 'original', 0], [11, 'modified', 0], [0, 'original', undefined], [99, 'modified', undefined]]) {
    assert.equal(review.findLineChangeIndexBySideLineNumber(list, line, side), expected)
  }
  assert.equal(review.isLineNumberInLineChange(list[1], 99, 'original'), false)
  assert.equal(review.isLineNumberInRange(3, 0, 5), false)
  assert.equal(review.isLineNumberInRange(3, 2, 0), false)
  assert.equal(review.isLineNumberInRange(1, 2, 5), false)
})
test('diff line information prefers mapped equivalent lines and falls back across both sides', () => {
  const diffEditor = { getDiffLineInformationForOriginal: () => ({ equivalentLineNumber: 6 }), getDiffLineInformationForModified: () => ({ equivalentLineNumber: 2 }) }
  for (const [side, action, lineNumber] of [['original', 'accept', 99], ['modified', 'accept', 99], ['modified', 'reject', 99]]) {
    assert.equal(review.getReviewActionIndexFromDiffLineInformation({ side, action, lineNumber, lineChanges: list, diffEditor }), 0)
  }
  const emptyInfo = { getDiffLineInformationForOriginal: () => null, getDiffLineInformationForModified: () => null }
  assert.equal(review.getReviewActionIndexFromDiffLineInformation({ side: 'original', action: 'reject', lineNumber: 99, lineChanges: list, diffEditor: emptyInfo }), undefined)
  assert.equal(review.getReviewActionIndexFromDiffLineInformation({ side: 'modified', action: 'reject', lineNumber: 1, lineChanges: list, diffEditor: emptyInfo }), 0)
  assert.equal(review.getReviewActionIndexFromDiffLineInformation({ side: 'original', action: 'accept', lineNumber: 2, lineChanges: list, diffEditor: null }), undefined)
})
test('action lookup prioritizes engine mapping, then direct maps, next lines and nearest change', () => {
  const maps = review.createReviewActionMaps(list, model, model)
  maps.originalAcceptMap[15] = 2
  for (const [side, action, lineNumber] of [['original', 'accept', 15], ['modified', 'accept', 6], ['original', 'reject', 2], ['modified', 'reject', 10]]) {
    const result = review.getReviewActionIndex({ side, action, lineNumber, maps, lineChanges: list })
    assert.equal(typeof result, 'number')
  }
  const emptyMaps = review.createReviewActionMaps([], model, model)
  const lookup = (overrides = {}) => review.getReviewActionIndex({ side: 'modified', action: 'reject', lineNumber: 1, maps: emptyMaps, lineChanges: list, ...overrides })
  assert.equal(lookup({ maps: { ...emptyMaps, modifiedRejectMap: { 2: 1 } } }), 1)
  assert.equal(lookup({ maps: { ...emptyMaps, originalRejectMap: { 2: 2 } } }), 2)
  assert.equal(lookup(), 0)
  assert.equal(lookup({ lineNumber: 99 }), undefined)
  assert.equal(lookup({ side: 'original', action: 'accept', lineNumber: 3 }), 0)
  assert.equal(lookup({ diffEditor: { getDiffLineInformationForModified: () => ({ equivalentLineNumber: 15 }) } }), 2)
})
test('applying a missing-model change or an identical change does not create undo edits', () => {
  const c = change(1, 1, 1, 1)
  assert.equal(review.applyLineChange({ lineChanges: [c], originalModel: null, modifiedModel: model }, 0, 'accept'), null)
  assert.equal(review.applyLineChange({ lineChanges: [c], originalModel: model, modifiedModel: null }, 0, 'reject'), null)
  const same = { getValue: () => 'same', getEOL: () => '\n', pushEditOperations: () => assert.fail('No-op edit') }
  assert.equal(review.applyLineChange({ lineChanges: [c], originalModel: same, modifiedModel: same }, 0, 'accept'), c)
})
