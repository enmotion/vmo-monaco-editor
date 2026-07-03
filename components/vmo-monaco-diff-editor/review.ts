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
    const originalLineNumber = getReviewActionLineNumber(
      originalModel,
      lineChange.originalStartLineNumber,
      lineChange.originalEndLineNumber
    )
    const modifiedLineNumber = getReviewActionLineNumber(
      modifiedModel,
      lineChange.modifiedStartLineNumber,
      lineChange.modifiedEndLineNumber
    )

    if (modifiedLineNumber) {
      maps.modifiedAcceptMap[modifiedLineNumber] = index
    } else if (originalLineNumber) {
      maps.originalAcceptMap[originalLineNumber] = index
    }

    if (originalLineNumber) {
      maps.originalRejectMap[originalLineNumber] = index
      maps.modifiedRejectMap[originalLineNumber] = index
    } else if (modifiedLineNumber) {
      maps.modifiedRejectMap[modifiedLineNumber] = index
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
  const sourceRange =
    action == 'accept'
      ? getLineChangeRange(sourceModel, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber)
      : getLineChangeRange(sourceModel, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber)
  const targetRange =
    action == 'accept'
      ? getLineChangeRange(targetModel, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber)
      : getLineChangeRange(targetModel, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber)

  targetModel.pushEditOperations(
    [],
    [
      {
        range: targetRange,
        text: sourceModel.getValueInRange(sourceRange)
      }
    ],
    () => null
  )

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
  if (!model) return 0
  const lineCount = model.getLineCount()
  if (startLineNumber > 0) return Math.min(startLineNumber, lineCount)
  if (endLineNumber > 0) return Math.min(endLineNumber, lineCount)
  return 0
}

export function findNearestLineChangeIndex(
  lineChanges: Monaco.editor.ILineChange[],
  lineNumber: number,
  side: VmoMonacoReviewSide
) {
  const index = lineChanges.findIndex(lineChange => {
    const startLineNumber = side == 'original' ? lineChange.originalStartLineNumber : lineChange.modifiedStartLineNumber
    const endLineNumber = side == 'original' ? lineChange.originalEndLineNumber : lineChange.modifiedEndLineNumber
    if (startLineNumber == 0 || endLineNumber == 0) return false
    return lineNumber >= startLineNumber && lineNumber <= endLineNumber
  })
  return index >= 0 ? index : undefined
}

export function getReviewActionIndex(params: {
  action: VmoMonacoReviewAction
  side: VmoMonacoReviewSide
  lineNumber: number
  maps: VmoMonacoReviewActionMaps
  lineChanges: Monaco.editor.ILineChange[]
}) {
  const directIndex =
    params.action == 'accept'
      ? params.side == 'original'
        ? params.maps.originalAcceptMap[params.lineNumber]
        : params.maps.modifiedAcceptMap[params.lineNumber]
      : params.side == 'original'
        ? params.maps.originalRejectMap[params.lineNumber]
        : params.maps.modifiedRejectMap[params.lineNumber]

  if (!isNil(directIndex)) return directIndex

  return findNearestLineChangeIndex(params.lineChanges, params.lineNumber, params.side)
}
