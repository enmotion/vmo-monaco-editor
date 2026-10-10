# 代码补全与类型

普通编辑器通过 `remindConfig` 添加 SQL、Python、Groovy 或默认语言的补全上下文。配置变化时旧 provider 会被释放，提示作用于当前编辑器的 model。

## 添加补全上下文

```vue
<VmoMonacoEditor v-model="code" prefix="" suffix=""
  :monaco-options="{ language: 'sql' }" style="height: 400px"
  :remind-config="[{
    language: 'sql',
    extra: {
      properties: ['users', 'orders'],
      methods: ['COUNT', 'SUM']
    }
  }]" />
```

`extra` 是 `Partial<VmoMonacoContext>`，可按需提供：

```ts
import type { VmoMonacoContext } from 'vmo-monaco-editor'
const context: Partial<VmoMonacoContext> = {
  types: ['User'],
  properties: ['users'],
  operators: ['AND', 'OR'],
  methods: [{ label: 'findUser', documentation: 'Find a user',
    parameters: [{ name: 'id', type: 'number', description: 'User ID' }] }],
  objects: [{ label: 'user',
    properties: [{ name: 'name', type: 'string', description: 'User name' }],
    methods: [{ name: 'save', parameters: '', description: 'Save user' }] }]
}
```

一般只需传入 `remindConfig`。底层工厂也通过 `useReminderPlugin` 导出，手动注册时请管理 provider 生命周期：

```ts
import { useReminderPlugin } from 'vmo-monaco-editor'
const sqlFactory = useReminderPlugin('sql')
const pythonFactory = useReminderPlugin('python')
const groovyFactory = useReminderPlugin('groovy')
const defaultFactory = useReminderPlugin()
```

## 公共类型

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
  VmoMonacoPreviewSource,
  VmoMonacoControlTarget,
  VmoPreviewTheme,
  VmoMarkdownRender,
  VmoCodePreviewOptions
} from 'vmo-monaco-editor'
```

各独立工具栏控件同时导出其 `VmoMonaco*ControlConfig`、`VmoMonaco*ControlValue` 类型。上下文类型包括 `VmoMonacoContext`、`VmoMonacoContextMethod`、`VmoMonacoContextObject`。

```ts
import { ref } from 'vue'
import type { VmoMonacoDiffEditorExpose } from 'vmo-monaco-editor'
const diffRef = ref<VmoMonacoDiffEditorExpose | null>(null)
diffRef.value?.changeDisplayMode('diff')
```

`VmoMonacoEditorOption` 是 Monaco 普通编辑器选项的部分类型，主题限定为 `vs-dark` / `vs-light`。`VmoCodePreviewOptions` 排除由预览组件管理的 value、model、language、theme、readOnly、domReadOnly 字段。
