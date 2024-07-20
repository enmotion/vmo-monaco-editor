import * as Monaco from 'monaco-editor'
import type { MonacoExtraContent, MonacoMethod, MonacoObject } from '@type'
import { computedCompletionItems } from '@lib/monaco-editor-inti'
const languageKeywords: string[] = []
const languageMethods: (MonacoMethod | string)[] = []
const languageTypes: string[] = []
const languageOperators: string[] = []
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
