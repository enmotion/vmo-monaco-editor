import type Monaco from 'monaco-editor'

export const vmoMonacoEditorDefaultOption: Partial<Monaco.editor.IStandaloneEditorConstructionOptions> = {
  theme: 'vs-dark',
  automaticLayout: true // 是否自动适应容器高宽
}
