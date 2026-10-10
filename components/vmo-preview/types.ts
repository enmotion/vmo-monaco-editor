import type * as Monaco from 'monaco-editor'

export type VmoPreviewTheme = 'vs-light' | 'vs-dark'
export type VmoMarkdownRender = (content: string) => string
// Content, language, theme and the owned model are managed by the preview itself.
export type VmoCodePreviewOptions = Omit<Partial<Monaco.editor.IStandaloneEditorConstructionOptions>,
  'value' | 'model' | 'language' | 'theme' | 'readOnly' | 'domReadOnly'>
