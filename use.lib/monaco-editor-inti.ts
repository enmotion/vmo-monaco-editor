import * as Monaco from 'monaco-editor'
import { MonacoContent, MonacoMethod } from '@type'
export const computedCompletionItems = (
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  content: MonacoContent
): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> => {
  const word = model.getWordUntilPosition(position)
  const range = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn
  }
  const suggestions: Monaco.languages.CompletionItem[] = []
  content.types.map(type => {
    suggestions.push({
      label: type,
      kind: Monaco.languages.CompletionItemKind.TypeParameter,
      insertText: type,
      range: range
    })
  })
  content.operators.map(operator =>
    suggestions.push({
      label: operator,
      kind: Monaco.languages.CompletionItemKind.Operator,
      insertText: operator,
      range: range
    })
  )
  content.propertys.map(keyword =>
    suggestions.push({
      label: keyword,
      kind: Monaco.languages.CompletionItemKind.Keyword,
      insertText: keyword,
      range: range
    })
  )
  content.methods.map(func => {
    if ((func as MonacoMethod).label) {
      const method: MonacoMethod = func as MonacoMethod
      const params = method.parameters?.map?.(p => `${p.name}${p.type ? ':' + p.type : ''}`).join(', ')
      console.log(func, {
        value: `${method.documentation}\n\nParameters:\n
        ${method.parameters?.map?.(p => `- ${p.name}: ${p.description}`).join('\n')}`
      })
      suggestions.push({
        label: method.label,
        kind: Monaco.languages.CompletionItemKind.Method,
        insertText: `${method.label}()`,
        insertTextRules: Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: `${method.documentation}\n\nParameters:\n
          ${method.parameters?.map?.(p => `- ${p.name}: ${p.description}`).join('\n')}`
        },
        range: range
      })
    } else {
      suggestions.push({
        label: func,
        kind: Monaco.languages.CompletionItemKind.Function,
        insertText: func + '()',
        insertTextRules: Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: range
      })
    }
  })
  return {
    suggestions: suggestions
  }
}
