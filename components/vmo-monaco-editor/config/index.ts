import type Monaco from 'monaco-editor'

export const vmoMonacoEditorDefaultOption: Partial<Monaco.editor.IStandaloneEditorConstructionOptions> = {
  automaticLayout: true, // 是否自动适应容器高宽
  theme: 'vs-dark',
  language: 'typescript',
  lineNumbers: 'on',
  fontSize: 12,
  minimap: {
    enabled: true
  }
}
