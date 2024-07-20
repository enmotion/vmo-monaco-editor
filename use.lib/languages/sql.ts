import * as Monaco from 'monaco-editor'
import type { MonacoExtraContent } from '@type'
const sqlKeywords = [
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
const sqlDataTypes = [
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
const sqlFunctions = [
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
const sqlOperators = [
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
export function sqlReminderRegisterCompletionItemProvider(
  extra: Partial<MonacoExtraContent>
): Monaco.languages.CompletionItemProvider {
  return {
    provideCompletionItems: function (model, position) {
      const word = model.getWordUntilPosition(position)
      const types = sqlDataTypes.concat(extra?.dateTypes || [])
      const operators = sqlOperators.concat(extra?.operators || [])
      const keywords = sqlKeywords.concat(extra?.propertys || [])
      const methods = sqlFunctions.concat(extra?.methods || [])
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }
      return {
        suggestions: [
          ...types.map(type => ({
            label: type,
            kind: Monaco.languages.CompletionItemKind.TypeParameter,
            insertText: type,
            range: range
          })),
          ...operators.map(operator => ({
            label: operator,
            kind: Monaco.languages.CompletionItemKind.Operator,
            insertText: operator,
            range: range
          })),
          ...keywords.map(keyword => ({
            label: keyword,
            kind: Monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range
          })),
          ...methods.map(func => ({
            label: func,
            kind: Monaco.languages.CompletionItemKind.Function,
            insertText: func + '()',
            insertTextRules: Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range
          }))
        ]
      }
    }
  }
}
