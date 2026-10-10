# Completion & types

See the [complete component API reference](./api) for all props, emits, instance properties and methods.


`useReminderPlugin(language)` returns a completion provider factory for built-in reminder languages:

```ts
const sqlReminder = useReminderPlugin('sql')
const pythonReminder = useReminderPlugin('python')
const groovyReminder = useReminderPlugin('groovy')
const defaultReminder = useReminderPlugin()
```

Usually you do not call this directly. Pass `remindConfig` to `VmoMonacoEditor`:

```vue
<vmo-monaco-editor
  v-model="code"
  :remind-config="[
    {
      language: 'sql',
      extra: {
        properties: ['table_a', 'table_b'],
        methods: ['COUNT', 'SUM']
      }
    }
  ]" />
```

## Type Exports

The package exports public types such as:

```ts
import type {
  VmoMonacoEditorExpose,
  VmoMonacoDiffEditorExpose,
  VmoMonacoEditorOption,
  VmoMonacoDiffChangePayload,
  VmoMonacoDiffConfirmPayload,
  VmoMonacoDiffReviewActionPayload,
  VmoMonacoDiffDisplayMode,
  VmoMonacoDiffViewMode,
  VmoMonacoControlTarget
} from 'vmo-monaco-editor'
```

## Completion limitations

The generator emits suggestions for `types`, `operators`, `properties` and `methods`. Although `objects` is typed and merged into context, it is not traversed by the current generator and produces no object/member or dot completion. Configuration appends to built-in lists without deduplication.

String methods insert `name()`. Structured methods insert parameter names and optional types, such as `findUser(id:number)`, without generated tab-stop placeholders. Suggestions replace the current word.

Omitting `language` selects the default factory with no built-in vocabulary and registers for the current model language. Language IDs must match Monaco; completion does not install highlighting, diagnostics or formatters. Only the normal editor supports `remindConfig`.

For manual registration, use `useReminderPlugin('sql')(extra, targetModel)` to scope the provider to one model. Omitting the second argument allows it to serve all models of the registered language. Dispose the registration returned by `Monaco.languages.registerCompletionItemProvider()` when replacing it or unmounting.
