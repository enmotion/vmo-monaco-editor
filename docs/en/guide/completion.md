# Completion & types


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

