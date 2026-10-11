import type { VmoMonacoViewMode, VmoMonacoDiffEditMode, VmoMonacoPreviewSource } from '../components/vmo-monaco-diff-editor/types'
import type * as Monaco from 'monaco-editor'

export type VmoMonacoContext = {
  types: string[]
  properties: string[]
  methods: (VmoMonacoContextMethod | string)[]

  operators: string[]
  objects: VmoMonacoContextObject[]
}
export type VmoMonacoContextObject = {
  label: string
  properties: { name: string; type: string; description: string }[]
  methods: { name: string; parameters: string; description: string }[]
}
export type VmoMonacoContextMethod = {
  label: string
  documentation?: string
  parameters?: { name: string; type?: string; description?: string }[]
}

export type VmoMonacoEditorOption = Partial<
  Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }
>

export type VmoMonacoEditorExpose = {
  currentViewMode: VmoMonacoViewMode
  hasPreview: boolean
  togglePreview: () => void
  changeViewMode: (mode: VmoMonacoViewMode) => void
  currentPreviewSource: VmoMonacoPreviewSource
  currentReadOnly?: boolean
  resetMonacoEditorOptions: (options: VmoMonacoEditorOption) => void
  fullscreenSwitch: () => void
  changeFullScreen: (value: boolean) => void
  changeLanguage: (language: string) => void
  commit: () => void
  computedMonacoEditorOption: VmoMonacoEditorOption
  isFullScreen: boolean
  needConfirm: boolean
  refreshMonacoEditor: () => void
}

export type VmoMonacoDiffEditorExpose = VmoMonacoEditorExpose & {
  currentEditMode: VmoMonacoDiffEditMode
  changeEditMode: (mode: VmoMonacoDiffEditMode) => void
  changePreviewSource: (source: VmoMonacoPreviewSource) => void
  currentDiffViewMode: 'side-by-side' | 'inline'
  diffPending?: boolean
  lineChanges: Monaco.editor.ILineChange[]
  resetMonacoDiffEditorOptions: (options: Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>) => void
  changeDiffViewMode: (mode: 'side-by-side' | 'inline') => void
  acceptChange: (index: number) => void
  rejectChange: (index: number) => void
  acceptAllChanges: () => void
  rejectAllChanges: () => void
  confirm: () => void
  getLineChanges: () => Monaco.editor.ILineChange[]
  getOriginalEditor: () => Monaco.editor.IStandaloneCodeEditor | null
  getModifiedEditor: () => Monaco.editor.IStandaloneCodeEditor | null
  getDiffEditor: () => Monaco.editor.IStandaloneDiffEditor | null
}
