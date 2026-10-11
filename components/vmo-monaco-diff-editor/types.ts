import type * as Monaco from 'monaco-editor'

export type VmoMonacoViewMode = 'edit' | 'preview'
export type VmoMonacoDiffEditMode = 'original' | 'modified' | 'diff'
export type VmoMonacoPreviewSource = 'original' | 'modified'
export type VmoMonacoDiffViewMode = 'side-by-side' | 'inline'

export type VmoMonacoDiffChangePayload = {
  originalValue: string
  modifiedValue: string
}

export type VmoMonacoDiffConfirmPayload = VmoMonacoDiffChangePayload & {
  confirmedValue: string
}

export type VmoMonacoDiffReviewActionPayload = VmoMonacoDiffChangePayload & {
  index?: number
  lineChange?: Monaco.editor.ILineChange
}

export type VmoMonacoNormalEditor = Monaco.editor.IStandaloneCodeEditor
export type VmoMonacoDiffEditor = Monaco.editor.IStandaloneDiffEditor
export type VmoMonacoAnyDiffEditor = VmoMonacoNormalEditor | VmoMonacoDiffEditor

export type VmoMonacoReviewAction = 'accept' | 'reject'
export type VmoMonacoReviewSide = 'original' | 'modified'

export type VmoMonacoReviewActionMaps = {
  originalAcceptMap: Record<number, number>
  originalRejectMap: Record<number, number>
  modifiedAcceptMap: Record<number, number>
  modifiedRejectMap: Record<number, number>
}
