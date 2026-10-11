# 差异编辑与审阅

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

`VmoMonacoDiffEditor` 保持两个稳定的 Monaco model：`originalValue` 为原文/当前确认稿，`modifiedValue` 为提案。接受修改将提案中的对应内容复制到原文；拒绝修改将原文对应内容复制回提案。

## 完整示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoDiffEditor, VmoMonacoUi } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const original = ref('hello world')
const proposal = ref('hello monaco')
const diffRef = ref()
</script>

<template>
  <VmoMonacoDiffEditor
    ref="diffRef"
    v-model:original-value="original"
    v-model:modified-value="proposal"
    :need-confirm="true"
    edit-mode="diff" diff-view-mode="inline"
    :editable-original="true" :editable-modified="true"
    :monaco-options="{ language: 'plaintext', theme: 'vs-light', wordWrap: 'on' }"
    style="height: 500px">
    <VmoMonacoUi :monaco="diffRef" title="Review"
      :config="{ reviewActions: true, commit: true, theme: true, fullScreen: true }" />
  </VmoMonacoDiffEditor>
</template>
```

## 显示状态与双向绑定

界面区分“内容”（正文／提案／比对）与“模式”（编辑／只读／预览）。API 使用独立的 viewMode 与 editMode；预览内容由 `previewSource` 指定。只读由 `disabled`、`editableOriginal`、`editableModified` 决定，`currentReadOnly` 可读取当前视图的编辑限制。

| 状态 | props / v-model | 更新事件 |
| --- | --- | --- |
| 编辑／预览 | `viewMode` / `v-model:view-mode` | `update:viewMode` |
| 正文／提案／比对 | `editMode` / `v-model:edit-mode` | `update:editMode` |
| 预览正文／提案 | `previewSource` / `v-model:preview-source` | `update:previewSource` |
| 并排／行内 | `diffViewMode` / `v-model:diff-view-mode` | `update:diffViewMode` |
| 主题／字号／语言／行号／小地图 | `monacoOptions` / `v-model:monaco-options` | `update:monacoOptions` |
| 差异选项 | `diffOptions` / `v-model:diff-options` | `update:diffOptions` |
| 全屏 | `fullScreen` / `v-model:full-screen` | `update:fullScreen` |

props 初始化内部状态；内部操作先更新自身，再 emit。父组件不回写时，内部状态仍保留；外部值真正变化时才同步覆盖。`monacoOptions` 和 `diffOptions` 按顶层字段比较，等价重渲染保留内部设置，嵌套对象作为一个字段同步。重复设置相同内部状态不会重复发出编辑器状态更新事件。

```vue
<VmoMonacoDiffEditor
  v-model:edit-mode="editMode" v-model:view-mode="viewMode"
  v-model:preview-source="previewSource"
  v-model:diff-view-mode="diffViewMode"
  v-model:monaco-options="editorOptions"
  v-model:diff-options="diffOptions"
  v-model:full-screen="fullScreen">
  <template #preview="{ content }"><pre>{{ content }}</pre></template>
</VmoMonacoDiffEditor>
```

以上绑定变量由父组件定义：`editMode` 初始可为 `'diff'`，`viewMode` 为 `'edit'`，`previewSource` 为 `'modified'`，`diffViewMode` 为 `'side-by-side'`，两个选项对象为 `{}`，`fullScreen` 为 `false`。完整变量定义见[工具栏状态绑定示例](./toolbar#状态双向绑定)。预览需要 `preview` 插槽；没有插槽时不能进入预览。

只接收事件、暂不回写时使用 `:edit-mode="editMode" @update:edit-mode="handleMode($event)"`。`edit-mode-change`、`view-mode-change` 和 `preview-source-change` 分别通知独立状态变化，同时补充 `diff-view-mode-change`、`options-change`、`diff-options-change` 和 `fullscreen-change`。监听编辑器自身即可获取默认工具栏产生的状态变化，不需要 UI 转发控件事件。

## 提交语义

`needConfirm=true` 时，普通编辑与接受/拒绝操作只修改内部 model，不立即发出 `update:originalValue` 与 `update:modifiedValue` 内容事件；审阅事件仍然会发出。显示模式、预览来源、布局、设置和全屏事件仍即时发出；`bidibind` 也仅影响文本值同步。`confirm()` 或 `commit()` 提交当前两个 model，并发出 `confirm`；其中 `confirmedValue` 是当前 **original** 内容。

确认不会自动接受剩余提案。如果要保存所有提案内容，可调用 `acceptAllChanges()`，再调用 `confirm()`（批量复制不依赖差异计算）。接受/拒绝不等于后端持久化。


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
| `originalValue` | `string` | `''` | `v-model:original-value` |
| `modifiedValue` | `string` | `''` | `v-model:modified-value` |
| `prefix` / `suffix` | `string` | `''` | model 外的展示内容 |
| `viewMode` | `'edit' \| 'preview'` | `'edit'` | 独立编辑／预览状态 |
| `editMode` | `'original' \| 'modified' \| 'diff'` | `'diff'` | 独立编辑内容选择 |
| `previewSource` | `'original' \| 'modified'` | 未设置 | 指定预览来源 |
| `diffViewMode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | 差异布局 |
| `editableOriginal` | `boolean` | `false` | 允许编辑原文 |
| `editableModified` | `boolean` | `true` | 允许编辑提案 |
| `needConfirm` | `boolean` | `false` | 手动提交 |
| `bidibind` | `boolean` | `true` | 同步外部值 |
| `disabled` | `boolean` | `false` | 只读编辑视图 |
| `fullScreen` | `boolean` | `false` | 全屏状态，支持 `v-model:full-screen` |
| `zIndex` | `number` | `99` | 全屏层级 |
| `originalUri` | `string` | `'vmo-monaco-diff-original'` | 原文 model URI 标识 |
| `modifiedUri` | `string` | `'vmo-monaco-diff-modified'` | 提案 model URI 标识 |
| `monacoOptions` | `VmoMonacoEditorOption` | `{}` | 共享编辑器选项 |
| `diffOptions` | `Partial<IStandaloneDiffEditorConstructionOptions>` | `{}` | 差异选项 |
| `showReviewActions` | `boolean` | `true` | 启用原生 `+/-` 审阅点击处理 |

## 事件

以下用 `pair` 表示 `{ originalValue: string; modifiedValue: string }`。

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:viewMode` / `view-mode-change` | edit / preview | 视图状态变化 |
| `update:editMode` / `edit-mode-change` | original / modified / diff | 内容选择变化 |
| `update:previewSource` | original / modified | 实际预览来源变化 |
| `update:diffViewMode` / `diff-view-mode-change` | side-by-side / inline | 实际比对布局变化 |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | 控件或 API 实际改变共享配置 |
| `update:diffOptions` / `diff-options-change` | 差异选项对象 | API 实际改变差异配置 |
| `update:fullScreen` / `fullscreen-change` | `boolean` | 实际全屏状态变化 |
| `update:originalValue` | `string` | 原文更新/提交 |
| `update:modifiedValue` | `string` | 提案更新/提交 |
| `change` | `pair` | 当前两个 model 的内容 |
| `accept-change` / `reject-change` | `pair & { index?: number; lineChange?: ILineChange }` | 单个差异块接受/拒绝 |
| `accept-all` / `reject-all` | `pair` | 批量接受/拒绝 |
| `confirm` | `pair & { confirmedValue: string }` | 确认当前原文 |
| `preview-source-change` | `'original' \| 'modified'` | 预览来源切换 |
| `focuse` / `blur` | 无 | 焦点变化，保留 `focuse` 拼写 |

## 实例 API

```ts
diffRef.value.changeEditMode('diff')
diffRef.value.changeDiffViewMode('inline')
diffRef.value.acceptChange(0) // 当前 getLineChanges() 的零基索引
diffRef.value.rejectChange(0)
diffRef.value.acceptAllChanges()
diffRef.value.rejectAllChanges()
diffRef.value.confirm()
diffRef.value.commit()
diffRef.value.getLineChanges()
diffRef.value.getOriginalEditor()
diffRef.value.getModifiedEditor()
diffRef.value.getDiffEditor()
diffRef.value.resetMonacoEditorOptions({ fontSize: 16 })
diffRef.value.resetMonacoDiffEditorOptions({ ignoreTrimWhitespace: false }) // 布局使用 changeDiffViewMode
diffRef.value.changeLanguage('markdown')
diffRef.value.changeFullScreen(true)
diffRef.value.fullscreenSwitch()
diffRef.value.refreshMonacoEditor()
```

还可读取 `currentEditMode`、`currentDiffViewMode`、`lineChanges`、`diffPending`、`computedMonacoEditorOption`、`currentReadOnly` 和 `isFullScreen`。切换视图保持两个 model；差异异步计算时不要使用过时的差异索引。原文/提案单视图仍会通过脱离显示容器的 diff 实例计算差异。

默认、`prefix`、`suffix` 插槽与普通编辑器相同。`#preview` 与相关 API 见[预览组件](./preview)。

## 差异计算与 API 返回值

`diffPending=true` 表示最新内容的比较尚未完成，此时空的 `lineChanges` 不等于两份内容相同。单块接受/拒绝使用当前差异数组的零基索引；内容变化后旧索引立即失效。过期计算结果、越界索引或不存在的差异块会使单块操作直接返回，不发出成功审阅事件。

批量 API 与工具栏限制不同：工具栏在计算中禁用批量按钮，但 `acceptAllChanges()` / `rejectAllChanges()` 本身直接复制整份 model，不依赖差异索引，也不检查 `diffPending`。这两个方法返回 `void`，审阅事件在 Vue 的下一次 tick 发出；单块操作也是如此。不要把 `await acceptChange()` 当成等待差异重新计算完成。连续处理多个块时，每次都应等待新的计算完成并重新取得索引。

`getOriginalEditor()` / `getModifiedEditor()` 在 diff 模式返回对应编辑器，在单视图只返回当前显示的一侧；预览中返回 `null`。`getDiffEditor()` 只返回显示中的 diff editor，不返回后台计算实例。挂载前或切换过程也可能返回 `null`，使用可选链调用，避免长期缓存实例：切换显示模式会重建 editor。

## 编辑权限、URI 与模型生命周期

`disabled`、`editableOriginal`、`editableModified` 控制手动编辑，不限制公开的接受/拒绝 API。`showReviewActions=false` 只关闭原生差异标记的点击处理，不隐藏工具栏审阅控件，也不禁用程序调用。需要纯只读对比时，同时禁用输入、不展示审阅控件，并由应用限制审阅调用。

URI 属性是供组件构造 `inmemory://` URI 的标识，不是文件加载地址。默认标识附加组件 UID；发生冲突时继续生成唯一标识，可以同时挂载多个 diff 组件。URI 只在创建 model 时使用，挂载后修改 URI 属性不会重建 model；切换文件身份可使用 Vue 的 `:key` 重新挂载。

视图切换与 `refreshMonacoEditor()` 复用两份 model，保留文本及 model 撤销历史，但不保证光标、滚动或选区保留。组件卸载会释放两个 model 和后台比较实例。外部文本同步使用 `setValue()`，可能重置对应 model 的撤销历史；`needConfirm=true` 也不会阻止外部值覆盖未提交草稿。


## 插槽

| 名称 | 参数 | 默认内容与渲染条件 |
| --- | --- | --- |
| `default` | 无 | 位于编辑器上方，可放工具栏；未提供时不渲染此区域 |
| `prefix` | `{ option: VmoMonacoEditorOption }` | 替换上方附加内容；未提供插槽时用 `v-html` 渲染 prefix prop。插槽存在或 prefix 非空时渲染 |
| `suffix` | `{ option: VmoMonacoEditorOption }` | 替换下方附加内容；未提供插槽时用 `v-html` 渲染 suffix prop。插槽存在或 suffix 非空时渲染 |
| `preview` | `{ content: string; language: string; source: Source; theme: Theme }` | 仅在 currentViewMode 为 preview 时渲染；提供此插槽才有预览能力，无内置正文渲染器 |

`option` 是合并默认值后的当前配置，随状态更新。prefix／suffix 不是 Monaco model 内容；插槽不会得到草稿或提交方法。普通文本可用 Vue 插值，HTML prop 只应传入可信内容。

`content` 是 source 选中一侧的内部草稿，包括未提交修改；`language` 是当前编辑器语言，缺省回退 plaintext；`source` 为 original／modified；`theme` 是当前编辑器主题。插槽替换预览内容区域，不替换外层预览容器或来源按钮（提案非空时显示来源按钮）。不提供插槽时不能进入预览，没有插槽时 viewMode 回退到 edit，保留 editMode，移除插槽也会退出预览。

```vue
<VmoMonacoDiffEditor :original-value="original" :modified-value="proposal" style="height: 500px">
  <template #prefix="{ option }"><span>{{ option.language }}</span></template>
  <template #preview="{ content, language, source, theme }">
    <VmoCodePreview :content="content" :language="language" :theme="theme" />
    <span>{{ source }}</span>
  </template>
  <template #suffix="{ option }"><span>{{ option.fontSize }} px</span></template>
</VmoMonacoDiffEditor>
```
