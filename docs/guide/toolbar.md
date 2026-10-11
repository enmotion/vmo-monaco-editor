# 工具栏与控件

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

`VmoMonacoUi` 接收一个编辑器实例或实例数组，将其注入到内部控件。控件调用组件公开方法，不要求你自己操作 Monaco 原始实例。

## 配置工具栏

```vue
<VmoMonacoUi
  title="Editor"
  :monaco="editorRef"
  :config="{
    theme: true,
    fontSize: { min: 10, max: 32, step: 1 },
    lineNumbers: true,
    minimap: true,
    fullScreen: true,
    commit: true,
    languages: ['sql', 'javascript', 'typescript']
  }" />
```

| Prop | 默认值 | 说明 |
| --- | --- | --- |
| `title` | `'VMO:Editor'` | 工具栏标题 |
| `monaco` | `null` | 编辑器实例或实例数组 |
| `config` | 字号、主题、小地图、行号、全屏及默认语言列表 | 控件配置 |

显式传入 `config` 会替代默认配置对象；请列出需要展示的控件。`needConfirm=true` 的目标会自动显示提交按钮。存在预览插槽时预览开关自动出现，`preview: false` 可隐藏它。

## 当前状态与视图切换

工具栏第二行持续展示两个维度：**内容**（正文／提案／比对）和**模式**（编辑／只读／预览）。比对会标明并排或行内；预览会高亮实际预览的正文或提案。预览中切换正文／提案／比对只改变 editMode，预览来源由 previewSource 独立控制。预览按钮显示“返回编辑器”时，点击会恢复进入预览前的编辑器视图。

绑定编辑器后，当前语言、字号（px）、主题和待确认状态会跟随实例变化显示，即使对应设置控件隐藏也可以查看。传入实例数组时，当前视图及设置以首个对应实例为准，切换作用于所有对应实例。自定义默认插槽替换上方工具栏，状态行仍然保留。

## 状态双向绑定

编辑器以 props 初始化内部状态。内部切换立即生效并 emit `update:*`；即使父组件不回写，也会保留内部状态。只有外部 props 的值真正变化才同步覆盖；等价对象重渲染不会重置内部设置。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoDiffEditor, VmoMonacoUi, VmoTextPreview } from 'vmo-monaco-editor'
import type { VmoMonacoDiffEditMode, VmoMonacoViewMode, VmoMonacoDiffViewMode, VmoMonacoPreviewSource, VmoMonacoEditorOption } from 'vmo-monaco-editor'
import type { editor as MonacoEditor } from 'monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const diffRef = ref()
const original = ref('Original text')
const proposal = ref('Proposed text')
const editMode = ref<VmoMonacoDiffEditMode>('diff')
const viewMode = ref<VmoMonacoViewMode>('edit')
const previewSource = ref<VmoMonacoPreviewSource>('modified')
const diffViewMode = ref<VmoMonacoDiffViewMode>('side-by-side')
const editorOptions = ref<VmoMonacoEditorOption>({ theme: 'vs-light', language: 'plaintext', fontSize: 14 })
const diffOptions = ref<Partial<MonacoEditor.IStandaloneDiffEditorConstructionOptions>>({ ignoreTrimWhitespace: true })
const fullScreen = ref(false)
</script>

<template>
  <VmoMonacoDiffEditor ref="diffRef"
    v-model:original-value="original" v-model:modified-value="proposal"
    v-model:edit-mode="editMode" v-model:view-mode="viewMode"
    v-model:preview-source="previewSource"
    v-model:diff-view-mode="diffViewMode"
    v-model:monaco-options="editorOptions"
    v-model:diff-options="diffOptions"
    v-model:full-screen="fullScreen" style="height: 500px">
    <VmoMonacoUi :monaco="diffRef" :config="{ theme: true, fontSize: true, fullScreen: true, reviewActions: true }" />
    <template #preview="{ content, theme }">
      <VmoTextPreview :content="content" :theme="theme" />
    </template>
  </VmoMonacoDiffEditor>
</template>
```

`editorOptions` 中的 `theme`、`fontSize`、`language`、`lineNumbers` 和 `minimap.enabled` 随工具栏操作一起回传。普通编辑器同样支持 `v-model:monaco-options` 和 `v-model:full-screen`。不需要自动回写时，可以使用 `:edit-mode="editMode" @update:edit-mode="handleMode($event)"` 等形式，仅接收通知。

独立控件支持 `v-model:value`；语言和字号也支持 `v-model`（`modelValue` 别名）。显式值优先于别名和配置初始化内部状态，之后内部操作不等待父组件回写。外部值变化同步到目标编辑器，直接调用编辑器 API 的变化也会反映到控件。`config` 在 UI 容器中仍表示控件配置或可见性，不是编辑器状态绑定接口。

## Config

| 键 | 类型 | 说明 |
| --- | --- | --- |
| `theme` | `boolean \| 'vs-dark' \| 'vs-light'` | 主题开关 |
| `fontSize` | `boolean \| { min?: number; max?: number; step?: number }` | 字号输入 |
| `minimap` | `boolean` | 小地图开关 |
| `lineNumbers` | `boolean \| 'on' \| 'off'` | 行号开关 |
| `fullScreen` | `boolean` | 全屏开关 |
| `commit` | `boolean` | 提交按钮 |
| `preview` | `boolean` | 预览开关 |
| `reviewActions` | `boolean` | 差异审阅弹出菜单，需要 diff 目标 |
| `language` | `boolean \| { languages?: string[] }` | 语言选择配置 |
| `languages` | `string[]` | 语言列表快捷配置 |

只有语言列表多于一个选项才会显示选择器。`language: false` 显式隐藏选择器；当前语言不在列表内时会显示禁用的当前项。工具栏选择会在父组件以等价内联配置重渲染时保留；真正改变外部语言选项仍会同步生效。

## 自定义布局与独立控件

```vue
<script setup lang="ts">
import { VmoMonacoUi, VmoMonacoCommitButton, VmoMonacoDiffReview,
  VmoMonacoFontSizeInput, VmoMonacoThemeToggle } from 'vmo-monaco-editor'
// diffRef 为 VmoMonacoDiffEditor 的组件 ref
</script>

<template>
  <VmoMonacoUi :monaco="diffRef">
    <div style="display: flex; align-items: center; gap: 12px">
      <span>Review</span>
      <VmoMonacoCommitButton />
      <VmoMonacoDiffReview />
      <VmoMonacoFontSizeInput />
      <VmoMonacoThemeToggle />
    </div>
  </VmoMonacoUi>
</template>
```

在工具栏外使用控件时，直接传 `:monaco="editorRef"`。自定义默认插槽替换上方控件，状态行仍保留，预览开关仍由 `config.preview` 控制；无需重复放入预览控件。完全自建工具栏、不使用 `VmoMonacoUi` 时，可以单独添加 `VmoMonacoPreviewToggle`。

导出的独立控件：`VmoMonacoCommitButton`、`VmoMonacoFontSizeInput`、`VmoMonacoFullscreenToggle`、`VmoMonacoLanguageSelect`、`VmoMonacoLineNumbersToggle`、`VmoMonacoMinimapToggle`、`VmoMonacoDiffReview`、`VmoMonacoThemeToggle`、`VmoMonacoPreviewToggle`。控件接受 `monaco`、`config`；具体值类型由对应 `VmoMonaco*ControlValue` 导出类型定义。

| 控件 | 事件 |
| --- | --- |
| 主题、全屏、小地图、行号、预览 | `update:value`、`toggle`、`commit` |
| 字号 | `update:value`、`update:modelValue`、`commit` |
| 语言 | `update:value`、`update:modelValue`、`change`、`commit` |
| 提交按钮 | `commit` |
| 差异审阅 | `accept-all`、`reject-all`、`confirm`、`accept-change`、`reject-change`、`edit-mode-change`、`diff-view-mode-change` |

## 审阅菜单与插槽

审阅控件提供原文/提案/差异模式切换、差异块计数、内联/并排切换、全部接受/拒绝。计算中显示 `…`，计算未完成或没有差异时批量操作不可用。预览模式隐藏审阅布局和计数。

```vue
<VmoMonacoUi :monaco="diffRef" :config="{ reviewActions: true }">
  <template #review-actions="{ lineChanges, acceptAllChanges, rejectAllChanges, changeEditMode }">
    <button @click="changeEditMode('diff')">对比</button>
    <button @click="rejectAllChanges()">拒绝 {{ lineChanges.length }} 处修改</button>
    <button @click="acceptAllChanges()">全部接受</button>
  </template>
</VmoMonacoUi>
```

## 同时控制多个编辑器

传入 `:monaco="[primaryRef, secondaryRef]"`，字号、主题、语言、小地图和行号等控件操作应用于所有目标；全屏控件只切换第一个目标，预览与审阅控件仅操作符合条件的目标。提交按数组反向执行，第一个实例作为主要编辑器最后提交。

## 控件值与事件的含义

独立控件还接受 `value`，支持 `v-model:value`（字号、语言也发出 `update:modelValue`）。显式值用于初始化内部状态，外部真正变化时再同步；父组件不接收更新也不会阻止内部状态变化。工具栏 `config` 负责显示哪些控件，不应当作为设置编辑器初始选项的入口；初始主题、字号等应放在 `monacoOptions`。

```vue
<VmoMonacoThemeToggle
  :monaco="editorRef"
  v-model:value="selectedTheme"
  @commit="onControlCommit" />
```

其中 `selectedTheme` 是应用定义的 `'vs-dark' | 'vs-light'` 响应式值。普通控件的 `commit` 是操作通知，参数结构为 `{ type, value?, config?, monacoCount }`，不表示代码保存完成，也不会自动调用编辑器 `commit()`。提交按钮会先调用目标编辑器的 `commit()`，再发出同结构的操作通知；差异审阅控件发出操作通知，与编辑器本身的内容事件负载不同，详见[完整 API](./api#vmomonacodiffreview)。

多实例控件通常以第一个目标的选项显示当前值，操作作用于所有目标；这不是多个状态的汇总。`null` 目标会被过滤。显式 `monaco` 目标优先于工具栏注入值；传 `null` 会回退到注入值。


## 工具栏与控件插槽

| 组件 | 插槽 | 参数与用途 |
| --- | --- | --- |
| VmoMonacoUi | default | 无参数；替换上方默认控件，状态行保留；内部控件仍自动注入 editor |
| VmoMonacoUi | review-actions | 下表全部参数；替换内置审阅弹出菜单；需要默认工具栏和 config.reviewActions |
| VmoMonacoDiffReview | default | 下表全部参数；替换该控件弹出菜单 |
| VmoMonacoPreviewToggle | default | `{ active: boolean }`；替换按钮文字，不替换外层按钮及点击行为 |
| 提交、字号、语言、主题、全屏、行号、小地图控件 | 无 | 没有插槽出口；传入插槽内容不会渲染 |

两个审阅插槽仅在菜单打开时渲染，保留触发图标、弹出层及外部点击关闭逻辑。自定义 UI default 后，review-actions 不会自动转发给手动放入的审阅控件，应在 VmoMonacoDiffReview 上使用 default。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `lineChanges` | `Monaco.editor.ILineChange[]` | 首个差异目标当前差异块；计算中不要使用旧索引 |
| `diffPending` | `boolean` | 最新差异是否仍在计算 |
| `currentEditMode` | `EditMode` | 当前显示模式 |
| `currentViewMode` | `ViewMode` | 当前编辑／预览状态，独立于 editMode |
| `hasPreview` | `boolean` | 首个差异目标是否提供预览插槽 |
| `acceptChange` | `(index: number) => void` | 接受当前差异数组中的单块 |
| `rejectChange` | `(index: number) => void` | 拒绝当前差异数组中的单块 |
| `acceptAllChanges` | `() => void` | 接受全部修改 |
| `rejectAllChanges` | `() => void` | 拒绝全部修改 |
| `changeEditMode` | `(mode: EditMode) => void` | 只切换正文／提案／比对，保留 viewMode 和 previewSource |
| `changeDiffViewMode` | `(mode: LayoutMode) => void` | 切换并排／行内布局 |
| `confirm` | `() => void` | 确认当前内容 |

参数以 camelCase 解构，尽管模板绑定写为 kebab-case。插槽不提供 `canReview`、`currentDiffViewMode` 或 `closePanel`；可用 `diffPending || !lineChanges.length` 判断批量按钮是否应禁用。方法本身不检查此禁用条件。

```vue
<VmoMonacoDiffReview :monaco="diffRef">
  <template #default="{ lineChanges, diffPending, acceptAllChanges, rejectAllChanges, confirm }">
    <span>{{ diffPending ? '…' : lineChanges.length }}</span>
    <button :disabled="diffPending || !lineChanges.length" @click="rejectAllChanges()">Reject all</button>
    <button :disabled="diffPending || !lineChanges.length" @click="acceptAllChanges()">Accept all</button>
    <button @click="confirm()">Confirm</button>
  </template>
</VmoMonacoDiffReview>
```

```vue
<VmoMonacoPreviewToggle :monaco="diffRef">
  <template #default="{ active }">
    <span>{{ active ? 'Return to editor' : 'Preview' }}</span>
  </template>
</VmoMonacoPreviewToggle>
```
