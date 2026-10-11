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
  VmoMonacoDiffEditMode,
  VmoMonacoViewMode,
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
diffRef.value?.changeEditMode('diff')
```

`VmoMonacoEditorOption` 是 Monaco 普通编辑器选项的部分类型，主题限定为 `vs-dark` / `vs-light`。`VmoCodePreviewOptions` 排除由预览组件管理的 value、model、language、theme、readOnly、domReadOnly 字段。

## 当前补全能力的限制

`types`、`operators`、`properties` 和 `methods` 会生成提示；`objects` 虽在公共类型中定义并参与上下文合并，但当前提示生成器没有遍历它，因此不会产生对象、成员或点号后的补全。上面的 `objects` 示例仅展示类型结构。

这些配置追加到内置语言词表，不替换内置提示，也不会去重。字符串方法插入 `方法名()`；结构化方法按参数名和可选类型插入，例如 `findUser(id:number)`，不是自动生成的可跳转参数占位符。提示替换范围为当前光标所在单词。

省略 `language` 时使用默认工厂（无内置词表），并注册到当前 model 的语言。语言名称必须与 Monaco language ID 一致；提供提示不代表注册了语法高亮、诊断或格式化器。`remindConfig` 仅由普通编辑器支持，diff 编辑器没有此 prop。

手动使用工厂时可传入第二个参数 `targetModel` 限制提示作用范围；省略后 provider 可作用于注册语言的所有 model。注册返回的 disposable 必须在不再使用时释放：

```ts
import * as Monaco from 'monaco-editor'
import { useReminderPlugin } from 'vmo-monaco-editor'
// model 是调用方已创建的 SQL model
const provider = useReminderPlugin('sql')({ properties: ['users'] }, model)
const registration = Monaco.languages.registerCompletionItemProvider('sql', provider)
// 页面卸载或替换配置时调用
registration.dispose()
```
