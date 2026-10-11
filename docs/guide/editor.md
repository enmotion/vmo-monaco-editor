# 普通编辑器

状态变化不依赖外部监听或回写。内部操作立即生效并 emit `update:*`；外部 props 实际改变时同步内部状态。可以使用 `v-model:*` 双向绑定，也可以通过 `@update:*` 获取 `$event` 而不回写。`viewMode`、`editMode`、`previewSource`、`diffViewMode`、`fullScreen` 各有独立更新事件；主题、字号、语言通过 `update:monacoOptions` 一起回传。


## 独立的视图状态与内容状态

两个编辑器都提供 `viewMode: 'edit' | 'preview'`，支持 `v-model:view-mode`、`update:viewMode` 与 `view-mode-change`。差异编辑器另提供 `editMode: 'original' | 'modified' | 'diff'`，支持 `v-model:edit-mode`、`update:editMode` 与 `edit-mode-change`。改变任一状态不会改变另一状态。`diffViewMode` 仅表示比对布局，`previewSource` 仅表示预览草稿来源。props 初始化内部状态，外部实际改变时同步；外部不回写则保留内部操作结果。

两个编辑器的插槽一致：`default`、`prefix`、`preview`、`suffix`。preview 参数为 `{ content, language, source, theme }`，普通编辑器的 source 固定为 original。没有 preview 插槽时无法进入预览；移除插槽会返回 edit，保留差异编辑器的 editMode。普通编辑器切换时保留 Monaco 实例和草稿。

```vue
<VmoMonacoEditor v-model="body" v-model:view-mode="viewMode">
  <template #preview="{ content, language, source, theme }">
    <VmoTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoEditor>
<VmoMonacoDiffEditor
  v-model:original-value="body" v-model:modified-value="proposal"
  v-model:view-mode="viewMode" v-model:edit-mode="editMode">
  <template #preview="{ content, language, source, theme }">
    <VmoTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoDiffEditor>
```


props、emit 与完整实例成员清单见[组件 API 完整参考](./api)。

`VmoMonacoEditor` 通过 `v-model` 编辑一个字符串。配置放在 `monacoOptions`，工具栏通过组件实例调用公开方法。

## 实时绑定与手动提交

默认 `needConfirm=false`：每次内容变化发出 `update:modelValue`，失焦时发出 `change`。设置为 `true` 后，输入只更新内部草稿，调用 `commit()` 才发出这两个事件。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const code = ref('SELECT * FROM users')
const editorRef = ref()
function save(value: string) {
  console.log('Submitted:', value) // 在这里接入你的保存服务
}
</script>

<template>
  <VmoMonacoEditor
    ref="editorRef" v-model="code" :need-confirm="true"
    prefix="" suffix="" :monaco-options="{ language: 'sql', theme: 'vs-light' }"
    style="height: 400px" @change="save">
    <VmoMonacoUi :monaco="editorRef" :config="{ commit: true, theme: true }" />
  </VmoMonacoEditor>
  <button @click="editorRef?.commit()">保存</button>
</template>
```

`commit()` 只负责发出事件，数据库或 API 保存由宿主应用处理。`bidibind=false` 会停止将外部 `modelValue` 变更同步到内部编辑器，不会停止编辑器自身发出事件。

## 配置与全屏状态绑定

内容使用 `v-model`；主题、字号、语言、行号和小地图放在 `monacoOptions`，通过 `v-model:monaco-options` 回传；全屏使用 `v-model:full-screen`。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi } from 'vmo-monaco-editor'
import type { VmoMonacoEditorOption } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'
const code = ref('SELECT * FROM users')
const editorRef = ref()
const editorOptions = ref<VmoMonacoEditorOption>({ language: 'sql', theme: 'vs-light', fontSize: 14 })
const fullScreen = ref(false)
</script>

<template>
  <VmoMonacoEditor ref="editorRef" v-model="code"
    v-model:monaco-options="editorOptions" v-model:full-screen="fullScreen"
    prefix="" suffix="" style="height: 400px">
    <VmoMonacoUi :monaco="editorRef" />
  </VmoMonacoEditor>
</template>
```

props 初始化内部状态；内部操作立即生效并 emit 更新，即使父组件不回写也会保留。外部值真正变化才覆盖内部状态，等价配置对象的重渲染不会重置工具栏选择。配置按顶层字段同步，嵌套对象作为一个字段；删除外部字段会删除内部对应覆盖值。`needConfirm` 和 `bidibind` 只控制文本提交／同步，不会延迟或阻止设置与全屏状态更新。


## 配置与全屏状态的共同约定

普通编辑器与差异编辑器使用相同的配置和全屏状态管理逻辑，公开 props、事件、方法及插槽保持一致的既有契约：

- `resetMonacoEditorOptions()` 深度合并内部配置；差异编辑器的 `resetMonacoDiffEditorOptions()` 对 diff 配置采用同样规则。实际结果不变时不重复发出配置事件。
- 配置 props 按外部顶层字段的实际变化同步；嵌套对象作为完整字段比较。等价对象不会覆盖内部选择，删除外部字段会移除对应内部覆盖值。外部配置同步不发出配置回写事件。
- 内部配置变化先更新状态，再依次发出 `update:monacoOptions` 和 `options-change`（diff 配置对应 `update:diffOptions` 和 `diff-options-change`）。每个事件得到独立快照；监听器修改一个事件参数不会改变内部配置或另一个事件参数。快照是内部配置覆盖值，合并默认值后的实际配置从实例的 `computedMonacoEditorOption` 读取。
- `changeFullScreen(value)` 与 `fullscreenSwitch()` 先更新内部状态，再发出 `update:fullScreen` 与 `fullscreen-change`。真实外部 fullScreen 变化也通过同一入口同步；相同值和 v-model 回写不会重复发出事件。

父组件不回写时仍保留内部操作结果。`needConfirm` 与 `bidibind` 只影响文本提交／同步，不改变上述规则。

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `viewMode` | `'edit' \| 'preview'` | `'edit'` | 独立编辑／预览状态，支持 `v-model:view-mode` |
| `modelValue` | `string` | `'//code content gose here...'` | 编辑内容，支持 `v-model` |
| `prefix` | `string` | `'(()=>{})'` | 编辑器上方展示内容，不进入 model |
| `suffix` | `string` | `'};'` | 编辑器下方展示内容，不进入 model |
| `needConfirm` | `boolean` | `false` | 延迟提交内容 |
| `bidibind` | `boolean` | `true` | 同步外部内容变更 |
| `disabled` | `boolean` | `false` | 设置 Monaco 为只读 |
| `fullScreen` | `boolean` | `false` | 全屏状态，支持 `v-model:full-screen` |
| `zIndex` | `number` | `99` | 全屏容器层级 |
| `monacoOptions` | `VmoMonacoEditorOption` | `{}` | Monaco 配置增量 |
| `remindConfig` | `{ language?: 'sql' \| 'python' \| 'groovy'; extra: Partial<VmoMonacoContext> }[]` | `[]` | 自定义补全配置 |

默认 Monaco 配置为 `automaticLayout: true`、`theme: 'vs-dark'`、`language: 'typescript'`、`lineNumbers: 'on'`、`fontSize: 12`、`minimap: { enabled: true }`。传入配置与默认配置深度合并。

## 事件

| 事件 | 参数 | 触发时机 |
| --- | --- | --- |
| `update:viewMode` / `view-mode-change` | edit / preview | 编辑／预览状态实际变化 |
| `update:modelValue` | `string` | 实时编辑或 `commit()` |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | 控件或 API 实际改变配置，返回独立配置快照 |
| `update:fullScreen` / `fullscreen-change` | `boolean` | 全屏状态实际变化 |
| `change` | `string` | 默认失焦，或 `commit()` |
| `focuse` | 无 | 编辑器获得焦点，名称确实拼写为 `focuse` |
| `blur` | 无 | 编辑器失去焦点 |

## 实例方法与状态

```ts
editorRef.value.insertCodeString('SELECT ') // 在当前光标位置插入
editorRef.value.resetMonacoEditorOptions({ fontSize: 16 })
editorRef.value.changeLanguage('sql')
editorRef.value.changeFullScreen(true)
editorRef.value.fullscreenSwitch()
editorRef.value.changeViewMode('preview') // 需要 preview 插槽
editorRef.value.togglePreview()
editorRef.value.refreshMonacoEditor() // 保留内部文本，重建编辑器
editorRef.value.commit()
```

实例还提供 `innerValue`、`computedMonacoEditorOption` 、`currentReadOnly` 和 `isFullScreen`。公开的 `VmoMonacoEditorExpose` 类型没有列出 `insertCodeString` 和 `innerValue`；需要这些成员时可使用 Vue 的组件实例类型。

## 插槽

| 名称 | 参数 | 默认内容与渲染条件 |
| --- | --- | --- |
| `default` | 无 | 位于编辑器上方，可放工具栏；未提供时不渲染此区域 |
| `prefix` | `{ option: VmoMonacoEditorOption }` | 替换上方附加内容；未提供插槽时用 `v-html` 渲染 prefix prop。插槽存在或 prefix 非空时渲染 |
| `suffix` | `{ option: VmoMonacoEditorOption }` | 替换下方附加内容；未提供插槽时用 `v-html` 渲染 suffix prop。插槽存在或 suffix 非空时渲染 |
| `preview` | `{ content: string; language: string; source: 'original'; theme: Theme }` | 当前内部草稿，仅在 preview 状态渲染，无内置渲染器。 |

`option` 是合并默认值后的当前配置，随状态更新。prefix／suffix 不是 Monaco model 内容；插槽不会得到草稿或提交方法。普通文本可用 Vue 插值，HTML prop 只应传入可信内容。

```vue
<VmoMonacoEditor ref="editorRef" v-model="code" style="height: 400px">
  <template #default><VmoMonacoUi :monaco="editorRef" /></template>
  <template #prefix="{ option }"><span>{{ option.language }}</span></template>
  <template #suffix="{ option }"><span>{{ option.fontSize }} px</span></template>
</VmoMonacoEditor>
```

默认插槽用于工具栏。`prefix` / `suffix` 插槽接收 `{ option }`，可替代对应展示区域。

```vue
<template #prefix="{ option }">
  <span>当前语言：{{ option.language }}</span>
</template>
```

字符串 `prefix` / `suffix` 使用 `v-html` 渲染，只应传入可信内容。普通文本可用插槽和 Vue 插值显示。

## 外部更新、只读与刷新边界

- `needConfirm` 只控制向外提交，不能保护草稿免受外部更新影响。`bidibind=true` 时，父组件传入不同的 `modelValue` 会覆盖内部草稿，即使尚未提交。切换文件或重新请求数据前，应由应用决定保存还是放弃草稿。
- `bidibind=false` 仍使用 `modelValue` 初始化内容，只忽略后续外部变化；重新开启它不会主动补同步此前忽略的值，需再次改变外部值或重新挂载组件。
- 普通编辑器的只读状态为 `disabled || monacoOptions.readOnly`，可读取 `currentReadOnly`。`disabled=false` 不会解除 `monacoOptions.readOnly=true`。只读限制用户输入，`insertCodeString()` 等程序操作仍可修改内容。
- `resetMonacoEditorOptions()` 深度合并增量配置，不会清空全部配置。外部 `monacoOptions` 按顶层字段比较：真正改变的字段覆盖内部值，移除字段会删除内部对应配置并回到默认值。嵌套对象作为一个字段同步。
- `refreshMonacoEditor()` 保留草稿但销毁并重建 editor；默认自建 model 也会重建，因此撤销栈、光标和选区不保证保留。修改字号、语言等优先使用对应 API。
- 普通编辑器在布局变化时触发 `editor.action.formatDocument`；若当前语言注册了格式化器，调整尺寸可能引起格式化及内容事件。

### 使用完整的组件实例类型

组件 ref 在挂载前为 `null`。需要插入方法和内部草稿时，可使用实例类型：

```ts
import { ref } from 'vue'
import { VmoMonacoEditor } from 'vmo-monaco-editor'
const editorRef = ref<InstanceType<typeof VmoMonacoEditor> | null>(null)
function insertQuery() {
  editorRef.value?.insertCodeString('SELECT ')
}
```

`insertCodeString()` 在光标位置插入，不替换当前选区；尚无有效光标位置时不执行。读取 `innerValue` 可以取得尚未提交的草稿。组件卸载会释放自身创建的 editor、model 和补全 provider；通过 `monacoOptions.model` 提供的外部 model 由调用方管理。
