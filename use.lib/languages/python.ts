import * as Monaco from 'monaco-editor'
import type { MonacoExtraContent } from '@type'
const pythonKeywords = [
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield'
]
const pythonBuiltins = [
  'abs',
  'all',
  'any',
  'ascii',
  'bin',
  'bool',
  'breakpoint',
  'bytearray',
  'bytes',
  'callable',
  'chr',
  'classmethod',
  'compile',
  'complex',
  'delattr',
  'dict',
  'dir',
  'divmod',
  'enumerate',
  'eval',
  'exec',
  'exit',
  'file',
  'float',
  'format',
  'frozenset',
  'getattr',
  'globals',
  'hasattr',
  'hash',
  'help',
  'hex',
  'id',
  'input',
  'int',
  'isinstance',
  'issubclass',
  'iter',
  'len',
  'list',
  'locals',
  'map',
  'max',
  'memoryview',
  'min',
  'next',
  'object',
  'oct',
  'open',
  'ord',
  'pow',
  'print',
  'property',
  'quit',
  'range',
  'repr',
  'reversed',
  'round',
  'set',
  'setattr',
  'slice',
  'sorted',
  'staticmethod',
  'str',
  'sum',
  'super',
  'tuple',
  'type',
  'vars',
  'zip'
]
const pythonDataTypes = [
  'int',
  'float',
  'complex',
  'bool',
  'str',
  'list',
  'tuple',
  'set',
  'dict',
  'NoneType',
  'bytes',
  'bytearray',
  'frozenset'
]
const pythonOperators = [
  '+',
  '-',
  '*',
  '/',
  '//',
  '%',
  '**',
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '//=',
  '%=',
  '**=',
  '==',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  'is',
  'is not',
  'in',
  'not in',
  'and',
  'or',
  'not'
]
export function pythonReminderRegisterCompletionItemProvider(
  extra: Partial<MonacoExtraContent>
): Monaco.languages.CompletionItemProvider {
  return {
    provideCompletionItems: function (model, position) {
      const word = model.getWordUntilPosition(position)
      const types = pythonDataTypes.concat(extra?.dateTypes || [])
      const operators = pythonBuiltins.concat(extra?.operators || [])
      const keywords = pythonKeywords.concat(extra?.propertys || [])
      const methods = pythonBuiltins.concat(extra?.methods || [])
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
