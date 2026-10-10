import { isNil } from 'ramda'
import * as Monaco from 'monaco-editor'
import type {
  VmoMonacoReviewAction,
  VmoMonacoReviewActionMaps,
  VmoMonacoReviewSide
} from './types'

/**
 * 根据 Monaco diff 的 line changes 生成点击映射。
 *
 * 两端审阅模型里：
 * - accept: modified 当前差异块覆盖 original
 * - reject: original 当前差异块覆盖 modified
 *
 * inline diff 会把删除/新增都渲染到 modified editor 里，因此这里给 modified 侧补一份 reject 映射。
 */
export function createReviewActionMaps(
  lineChanges: Monaco.editor.ILineChange[],
  originalModel: Monaco.editor.ITextModel | null,
  modifiedModel: Monaco.editor.ITextModel | null
): VmoMonacoReviewActionMaps {
  const maps: VmoMonacoReviewActionMaps = {
    originalAcceptMap: {},
    originalRejectMap: {},
    modifiedAcceptMap: {},
    modifiedRejectMap: {}
  }

  lineChanges.forEach((lineChange, index) => {
    const originalLineNumbers = getLineChangeOriginalLineNumbers(lineChange, originalModel)
    const modifiedLineNumbers = getLineChangeModifiedLineNumbers(lineChange, modifiedModel)
    const originalLineNumber = originalLineNumbers[0]
    const modifiedLineNumber = modifiedLineNumbers[0]

    if (modifiedLineNumber) {
      addReviewActionMapEntries(maps.modifiedAcceptMap, modifiedLineNumbers, index)
    } else if (originalLineNumber) {
      addReviewActionMapEntries(maps.originalAcceptMap, originalLineNumbers, index)
    }

    if (originalLineNumber) {
      addReviewActionMapEntries(maps.originalRejectMap, originalLineNumbers, index)
      addReviewActionMapEntries(maps.modifiedRejectMap, originalLineNumbers, index)
      addReviewActionMapEntries(maps.modifiedRejectMap, modifiedLineNumbers, index)
    } else if (modifiedLineNumber) {
      addReviewActionMapEntries(maps.modifiedRejectMap, modifiedLineNumbers, index)
    }
  })

  return maps
}

/**
 * 把 diff block 中某一侧的行号范围转换为 Monaco Range。
 * start/end 为 0 表示该侧没有对应行，通常出现在纯新增或纯删除块。
 */
export function getLineChangeRange(
  model: Monaco.editor.ITextModel,
  startLineNumber: number,
  endLineNumber: number
) {
  const lineCount = model.getLineCount()
  if (startLineNumber == 0 || endLineNumber == 0) {
    const targetLine = Math.min(Math.max(startLineNumber || endLineNumber || 1, 1), lineCount)
    return new Monaco.Range(targetLine, 1, targetLine, 1)
  }

  const safeStartLineNumber = Math.min(Math.max(startLineNumber, 1), lineCount)
  const safeEndLineNumber = Math.min(Math.max(endLineNumber, safeStartLineNumber), lineCount)
  return new Monaco.Range(
    safeStartLineNumber,
    1,
    safeEndLineNumber,
    model.getLineMaxColumn(safeEndLineNumber)
  )
}

/**
 * 对一个 diff block 执行 accept/reject。
 * accept 使用 modified 覆盖 original；reject 使用 original 覆盖 modified。
 */
export function applyLineChange(
  params: {
    lineChanges: Monaco.editor.ILineChange[]
    originalModel: Monaco.editor.ITextModel | null
    modifiedModel: Monaco.editor.ITextModel | null
  },
  index: number,
  action: VmoMonacoReviewAction
) {
  const lineChange = params.lineChanges[index]
  if (!lineChange || !params.originalModel || !params.modifiedModel) return null

  const sourceModel = action == 'accept' ? params.modifiedModel : params.originalModel
  const targetModel = action == 'accept' ? params.originalModel : params.modifiedModel
  const sourceStart = action == 'accept' ? lineChange.modifiedStartLineNumber : lineChange.originalStartLineNumber
  const sourceEnd = action == 'accept' ? lineChange.modifiedEndLineNumber : lineChange.originalEndLineNumber
  const targetStart = action == 'accept' ? lineChange.originalStartLineNumber : lineChange.modifiedStartLineNumber
  const targetEnd = action == 'accept' ? lineChange.originalEndLineNumber : lineChange.modifiedEndLineNumber

  // A missing side uses start as the preceding-line anchor and end=0.
  // Splice complete logical lines so insertion/deletion also transfers the newline.
  const sourceLines = sourceModel.getValue().split(/\r\n|\r|\n/)
  const targetLines = targetModel.getValue().split(/\r\n|\r|\n/)
  const replacement = sourceEnd === 0 ? [] : sourceLines.slice(sourceStart - 1, sourceEnd)
  const insertionIndex = targetEnd === 0 ? targetStart : targetStart - 1
  const deleteCount = targetEnd === 0 ? 0 : targetEnd - targetStart + 1
  const nextLines = targetLines.slice(0, insertionIndex).concat(replacement, targetLines.slice(insertionIndex + deleteCount))
  const before = targetModel.getValue()
  const after = nextLines.join(targetModel.getEOL())
  if (before === after) return lineChange

  // Apply only the changed span and retain Monaco's undo history.
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start]) start++
  let beforeEnd = before.length
  let afterEnd = after.length
  while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd--
    afterEnd--
  }
  const startPosition = targetModel.getPositionAt(start)
  const endPosition = targetModel.getPositionAt(beforeEnd)
  targetModel.pushStackElement()
  targetModel.pushEditOperations([], [{
    range: new Monaco.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column),
    text: after.slice(start, afterEnd)
  }], () => null)
  targetModel.pushStackElement()

  return lineChange
}

/**
 * 从 Monaco mouse event 中判断用户点击的是原生 + 还是 -。
 * Monaco 在 inline / side-by-side 下 DOM 结构不同，所以这里同时检查文本和 class。
 */
export function getNativeDiffAction(
  event: Monaco.editor.IEditorMouseEvent,
  rootElement: HTMLElement | null
): VmoMonacoReviewAction | null {
  const target = event.event.browserEvent.target as HTMLElement | null
  const actionNode = findNativeDiffActionNode(target, rootElement)
  const text = actionNode?.textContent?.trim()
  const className = actionNode?.className?.toString() || ''

  if (text == '+') return 'accept'
  if (text == '-') return 'reject'
  if (className.includes('insert') || className.includes('add')) return 'accept'
  if (className.includes('delete') || className.includes('remove')) return 'reject'
  return null
}

/**
 * 在用户点击的 DOM 向上查找 Monaco 原生 diff 操作节点。
 */
export function findNativeDiffActionNode(target: HTMLElement | null, rootElement: HTMLElement | null) {
  let node = target
  while (node && node != rootElement) {
    const text = node.textContent?.trim()
    const className = node.className?.toString() || ''
    if (
      text == '+' ||
      text == '-' ||
      className.includes('line-insert') ||
      className.includes('line-delete') ||
      className.includes('char-insert') ||
      className.includes('char-delete') ||
      className.includes('insert-sign') ||
      className.includes('delete-sign') ||
      className.includes('remove')
    ) {
      return node
    }
    node = node.parentElement
  }
  return null
}

export function getReviewActionLineNumber(
  model: Monaco.editor.ITextModel | null,
  startLineNumber: number,
  endLineNumber: number
) {
  return getReviewActionLineNumbers(model, startLineNumber, endLineNumber)[0] || 0
}

export function getReviewActionLineNumbers(
  model: Monaco.editor.ITextModel | null,
  startLineNumber: number,
  endLineNumber: number
) {
  if (!model) return []
  const lineCount = model.getLineCount()
  if (startLineNumber <= 0 && endLineNumber <= 0) return []
  const safeStartLineNumber = Math.min(Math.max(startLineNumber || endLineNumber, 1), lineCount)
  const safeEndLineNumber = Math.min(Math.max(endLineNumber || startLineNumber, safeStartLineNumber), lineCount)
  const lineNumbers = [] as number[]
  for (let lineNumber = safeStartLineNumber; lineNumber <= safeEndLineNumber; lineNumber++) {
    lineNumbers.push(lineNumber)
  }
  return lineNumbers
}

export function getLineChangeOriginalLineNumbers(
  lineChange: Monaco.editor.ILineChange,
  model: Monaco.editor.ITextModel | null
) {
  return uniqueLineNumbers([
    ...getReviewActionLineNumbers(model, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber),
    ...getCharChangeLineNumbers(lineChange.charChanges, model, 'original')
  ])
}

export function getLineChangeModifiedLineNumbers(
  lineChange: Monaco.editor.ILineChange,
  model: Monaco.editor.ITextModel | null
) {
  return uniqueLineNumbers([
    ...getReviewActionLineNumbers(model, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber),
    ...getCharChangeLineNumbers(lineChange.charChanges, model, 'modified')
  ])
}

export function getCharChangeLineNumbers(
  charChanges: Monaco.editor.ICharChange[] | undefined,
  model: Monaco.editor.ITextModel | null,
  side: VmoMonacoReviewSide
) {
  if (!charChanges) return []
  return charChanges.flatMap(charChange => {
    return side == 'original'
      ? getReviewActionLineNumbers(model, charChange.originalStartLineNumber, charChange.originalEndLineNumber)
      : getReviewActionLineNumbers(model, charChange.modifiedStartLineNumber, charChange.modifiedEndLineNumber)
  })
}

export function uniqueLineNumbers(lineNumbers: number[]) {
  return [...new Set(lineNumbers)].filter(lineNumber => lineNumber > 0)
}

export function addReviewActionMapEntries(map: Record<number, number>, lineNumbers: number[], index: number) {
  lineNumbers.forEach(lineNumber => {
    map[lineNumber] = index
  })
}

export function findNearestLineChangeIndex(
  lineChanges: Monaco.editor.ILineChange[],
  lineNumber: number,
  side: VmoMonacoReviewSide,
  action?: VmoMonacoReviewAction
) {
  const index = lineChanges.findIndex(lineChange => {
    const startLineNumber = side == 'original' ? lineChange.originalStartLineNumber : lineChange.modifiedStartLineNumber
    const endLineNumber = side == 'original' ? lineChange.originalEndLineNumber : lineChange.modifiedEndLineNumber
    if (isLineNumberInRange(lineNumber, startLineNumber, endLineNumber)) return true

    // Inline diff renders deleted original lines in the modified editor.
    // A click on "-" can therefore report the original line number while the event side is "modified".
    return side == 'modified' && action == 'reject'
      ? isLineNumberInRange(lineNumber, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber)
      : false
  })
  return index >= 0 ? index : undefined
}

export function findLineChangeIndexBySideLineNumber(
  lineChanges: Monaco.editor.ILineChange[],
  lineNumber: number,
  side: VmoMonacoReviewSide
) {
  if (lineNumber <= 0) return undefined
  const index = lineChanges.findIndex(lineChange => {
    return isLineNumberInLineChange(lineChange, lineNumber, side)
  })
  return index >= 0 ? index : undefined
}

export function isLineNumberInLineChange(
  lineChange: Monaco.editor.ILineChange,
  lineNumber: number,
  side: VmoMonacoReviewSide
) {
  const startLineNumber = side == 'original' ? lineChange.originalStartLineNumber : lineChange.modifiedStartLineNumber
  const endLineNumber = side == 'original' ? lineChange.originalEndLineNumber : lineChange.modifiedEndLineNumber
  if (isLineNumberInRange(lineNumber, startLineNumber, endLineNumber)) return true

  return (lineChange.charChanges || []).some(charChange => {
    const charStartLineNumber = side == 'original' ? charChange.originalStartLineNumber : charChange.modifiedStartLineNumber
    const charEndLineNumber = side == 'original' ? charChange.originalEndLineNumber : charChange.modifiedEndLineNumber
    return isLineNumberInRange(lineNumber, charStartLineNumber, charEndLineNumber)
  })
}

export function isLineNumberInRange(lineNumber: number, startLineNumber: number, endLineNumber: number) {
  if (startLineNumber == 0 || endLineNumber == 0) return false
  return lineNumber >= startLineNumber && lineNumber <= endLineNumber
}

export function getReviewActionIndexFromDiffLineInformation(params: {
  action: VmoMonacoReviewAction
  side: VmoMonacoReviewSide
  lineNumber: number
  lineChanges: Monaco.editor.ILineChange[]
  diffEditor: Monaco.editor.IStandaloneDiffEditor | null
}) {
  if (!params.diffEditor) return undefined

  const diffLineInformation =
    params.side == 'original'
      ? params.diffEditor.getDiffLineInformationForOriginal(params.lineNumber)
      : params.diffEditor.getDiffLineInformationForModified(params.lineNumber)
  const equivalentLineNumber = diffLineInformation?.equivalentLineNumber || 0

  const candidates =
    params.side == 'modified' && params.action == 'reject'
      ? [
          { side: 'original' as const, lineNumber: equivalentLineNumber },
          { side: 'modified' as const, lineNumber: params.lineNumber },
          { side: 'original' as const, lineNumber: params.lineNumber },
          { side: 'original' as const, lineNumber: params.lineNumber + 1 },
          { side: 'modified' as const, lineNumber: params.lineNumber + 1 }
        ]
      : params.side == 'modified'
        ? [
            { side: 'modified' as const, lineNumber: params.lineNumber },
            { side: 'original' as const, lineNumber: equivalentLineNumber }
          ]
        : [
            { side: 'original' as const, lineNumber: params.lineNumber },
            { side: 'modified' as const, lineNumber: equivalentLineNumber }
          ]

  for (const candidate of candidates) {
    const index = findLineChangeIndexBySideLineNumber(params.lineChanges, candidate.lineNumber, candidate.side)
    if (!isNil(index)) return index
  }

  return undefined
}

export function getReviewActionIndex(params: {
  action: VmoMonacoReviewAction
  side: VmoMonacoReviewSide
  lineNumber: number
  maps: VmoMonacoReviewActionMaps
  lineChanges: Monaco.editor.ILineChange[]
  diffEditor?: Monaco.editor.IStandaloneDiffEditor | null
}) {
  const diffLineInformationIndex = getReviewActionIndexFromDiffLineInformation({
    action: params.action,
    side: params.side,
    lineNumber: params.lineNumber,
    lineChanges: params.lineChanges,
    diffEditor: params.diffEditor || null
  })
  if (!isNil(diffLineInformationIndex)) return diffLineInformationIndex

  const directIndex =
    params.action == 'accept'
      ? params.side == 'original'
        ? params.maps.originalAcceptMap[params.lineNumber]
        : params.maps.modifiedAcceptMap[params.lineNumber]
      : params.side == 'original'
        ? params.maps.originalRejectMap[params.lineNumber]
        : params.maps.modifiedRejectMap[params.lineNumber]

  if (!isNil(directIndex)) return directIndex

  if (params.side == 'modified' && params.action == 'reject') {
    const nextLineIndex =
      params.maps.modifiedRejectMap[params.lineNumber + 1] ??
      params.maps.originalRejectMap[params.lineNumber + 1] ??
      findNearestLineChangeIndex(params.lineChanges, params.lineNumber + 1, params.side, params.action)
    if (!isNil(nextLineIndex)) return nextLineIndex
  }

  return findNearestLineChangeIndex(params.lineChanges, params.lineNumber, params.side, params.action)
}
