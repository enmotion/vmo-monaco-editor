import * as Monaco from 'monaco-editor'
import type { MonacoExtraContent, MonacoMethod, MonacoObject } from '@type'
import { computedCompletionItems } from '@lib/monaco-editor-inti'
const languageKeywords = [
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'def',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while'
]
const languageMethods: (MonacoMethod | string)[] = [
  'abs',
  'collect',
  'each',
  'find',
  'findAll',
  'flatten',
  'grep',
  'inject',
  'join',
  'max',
  'min',
  'print',
  'println',
  'size',
  'sort',
  'toString',
  'trim',
  'reverse',
  'take',
  'drop',
  'contains',
  'isEmpty',
  'replace',
  'split',
  'substring',
  'substring',
  'matches',
  'toLowerCase',
  'toUpperCase',
  'contains',
  'toList',
  'eachWithIndex'
]
const languageTypes = [
  'boolean',
  'byte',
  'char',
  'short',
  'int',
  'long',
  'float',
  'double',
  'void',
  'String',
  'List',
  'Map',
  'Set',
  'Closure',
  'Object'
]
const languageOperators = [
  '+',
  '-',
  '*',
  '/',
  '%',
  '**',
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '**=',
  '==',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  '&&',
  '||',
  '!',
  '~',
  '++',
  '--',
  '?:',
  '?<',
  '?<=',
  '?:',
  '->',
  '<->'
]
const contextObjects: MonacoObject[] = []
export default function RegisterCompletionItemProvider(
  extra: Partial<MonacoExtraContent>
): Monaco.languages.CompletionItemProvider {
  const types = languageTypes.concat(extra?.types || [])
  const operators = languageOperators.concat(extra?.operators || [])
  const propertys = languageKeywords.concat(extra?.propertys || [])
  const methods = languageMethods.concat(extra?.methods || [])
  const objects = contextObjects.concat(extra?.objects || [])
  return {
    provideCompletionItems: function (model, position): any {
      return computedCompletionItems(model, position, {
        types,
        operators,
        propertys,
        methods,
        objects
      })
    }
  }
}
