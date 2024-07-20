import * as Monaco from 'monaco-editor'
import { computedCompletionItems } from '@lib/monaco-editor-inti'
import type { VmoMonacoContext, VmoMonacoContextMethod, VmoMonacoContextObject } from '@type'
const languageKeywords = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'OUTER',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'CREATE',
  'ALTER',
  'DROP',
  'TABLE',
  'INDEX',
  'VIEW',
  'TRIGGER',
  'FUNCTION',
  'PROCEDURE',
  'DATABASE',
  'USER',
  'GRANT',
  'REVOKE',
  'UNION',
  'EXCEPT',
  'INTERSECT',
  'DISTINCT',
  'LIMIT',
  'OFFSET',
  'OFFSET',
  'FETCH',
  'SET',
  'VALUES',
  'AND',
  'OR',
  'NOT',
  'BETWEEN',
  'LIKE',
  'IN',
  'IS',
  'NULL',
  'AS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'CAST',
  'CONVERT',
  'COALESCE',
  'NULLIF',
  'IFNULL',
  'IF'
]
const languageTypes = [
  'INT',
  'INTEGER',
  'SMALLINT',
  'TINYINT',
  'BIGINT',
  'FLOAT',
  'REAL',
  'DOUBLE',
  'DECIMAL',
  'NUMERIC',
  'CHAR',
  'VARCHAR',
  'TEXT',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'TIME',
  'BOOLEAN',
  'BLOB',
  'JSON',
  'XML',
  'ENUM',
  'SET',
  'ARRAY'
]
const languageMethods: (VmoMonacoContextMethod | string)[] = [
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'UPPER',
  'LOWER',
  'ROUND',
  'CONCAT',
  'LENGTH',
  'SUBSTRING',
  'TRIM',
  'REPLACE',
  'COALESCE',
  'NULLIF',
  'IFNULL',
  'CAST',
  'CONVERT',
  'DATE_FORMAT',
  'DATEDIFF',
  'NOW',
  'CURRENT_DATE',
  'CURRENT_TIME',
  'CURRENT_TIMESTAMP'
]
const languageOperators = [
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
  '<>',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  'BETWEEN',
  'LIKE',
  'IN',
  'IS',
  'AND',
  'OR',
  'NOT'
]
const contextObjects: VmoMonacoContextObject[] = []
export default function RegisterCompletionItemProvider(
  extra: Partial<VmoMonacoContext>
): Monaco.languages.CompletionItemProvider {
  const types = languageTypes.concat(extra?.types || [])
  const operators = languageOperators.concat(extra?.operators || [])
  const propertys = languageKeywords.concat(extra?.propertys || [])
  const methods = languageMethods.concat(extra?.methods || [])
  const objects = contextObjects.concat(extra?.objects || [])
  return {
    provideCompletionItems: function (
      model,
      position
    ): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> {
      return computedCompletionItems(model, position, {
        types,
        operators,
        propertys,
        methods,
        objects
      })
      // const word = model.getWordUntilPosition(position)
      // const range = {
      //   startLineNumber: position.lineNumber,
      //   endLineNumber: position.lineNumber,
      //   startColumn: word.startColumn,
      //   endColumn: word.endColumn
      // }
      // return {
      //   suggestions: [
      //     ...types.map(type => ({
      //       label: type,
      //       kind: Monaco.languages.CompletionItemKind.TypeParameter,
      //       insertText: type,
      //       range: range
      //     })),
      //     ...operators.map(operator => ({
      //       label: operator,
      //       kind: Monaco.languages.CompletionItemKind.Operator,
      //       insertText: operator,
      //       range: range
      //     })),
      //     ...keywords.map(keyword => ({
      //       label: keyword,
      //       kind: Monaco.languages.CompletionItemKind.Keyword,
      //       insertText: keyword,
      //       range: range
      //     })),
      //     ...methods.map(func => ({
      //       label: func,
      //       kind: Monaco.languages.CompletionItemKind.Function,
      //       insertText: func + '()',
      //       insertTextRules: Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      //       range: range
      //     }))
      //   ]
      // }
    }
  }
}
