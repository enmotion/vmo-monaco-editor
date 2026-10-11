# 预览组件

## 独立的视图状态与内容状态

两个编辑器都提供 `viewMode: 'edit' | 'preview'`，支持 `v-model:view-mode`、`update:viewMode` 与 `view-mode-change`。差异编辑器另提供 `editMode: 'original' | 'modified' | 'diff'`，支持 `v-model:edit-mode`、`update:editMode` 与 `edit-mode-change`。改变任一状态不会改变另一状态。`diffViewMode` 仅表示比对布局，`previewSource` 仅表示预览草稿来源。props 初始化内部状态，外部实际改变时同步；外部不回写则保留内部操作结果。

两个编辑器的插槽一致：`default`、`prefix`、`preview`、`suffix`。preview 参数为 `{ content, language, source, theme }`，普通编辑器的 source 固定为 original。没有 preview 插槽时无法进入预览；移除插槽会返回 edit，保留差异编辑器的 editMode。普通编辑器切换时保留 Monaco 实例和草稿。

差异编辑器的 `displayMode`、`currentDisplayMode`、`changeDisplayMode` 是已弃用的兼容接口；currentDisplayMode 是派生值：viewMode 为 preview 时返回 preview，否则返回 editMode。显式的新 props 对各自维度优先。新接入请分别绑定两个状态。

```vue
<VmoMonacoEditor v-model="body" v-model:view-mode="viewMode">
  <template #preview="{ content, language, source, theme }">
    <VmoPlainTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoEditor>
<VmoMonacoDiffEditor
  v-model:original-value="body" v-model:modified-value="proposal"
  v-model:view-mode="viewMode" v-model:edit-mode="editMode">
  <template #preview="{ content, language, source, theme }">
    <VmoPlainTextPreview :content="content" :theme="theme" />
  </template>
</VmoMonacoDiffEditor>
```


props、emit 与完整实例成员清单见[组件 API 完整参考](./api)。

三个独立预览组件可单独使用，也可放进差异编辑器的 `#preview` 插槽：`VmoTextPreview` 展示文本，`VmoCodePreview` 使用只读 Monaco，`VmoMarkdownPreview` 渲染 Markdown。

## 独立使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoTextPreview, VmoCodePreview, VmoMarkdownPreview } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'
const markdown = ref('# Hello\n\n**Markdown** preview')
const code = ref('const message = "Hello"')
</script>

<template>
  <VmoTextPreview :content="markdown" />
  <VmoCodePreview :content="code" language="javascript" theme="vs-light" />
  <VmoMarkdownPreview :content="markdown" theme="vs-light" />
</template>
```

## Props

| 属性 | 组件 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | 全部 | `''` | 响应式展示内容 |
| `theme` | 全部 | `'vs-light'` | `'vs-light'` 或 `'vs-dark'` |
| `unstyled` | 文本、Markdown | `false` | 移除默认排版、颜色和间距，文本仍保留换行 |
| `language` | 代码 | `'plaintext'` | Monaco model 语言 |
| `monacoOptions` | 代码 | `{}` | 额外 Monaco 选项；内容/model、语言、主题、只读由组件管理 |
| `render` | Markdown | 内置 renderer | 同步 `(content: string) => string`，返回可信 HTML |

代码预览需要与编辑器相同的 worker 配置。默认只读、自动换行、字号 14、隐藏小地图，可以选择和复制内容。默认高度为 320px；通过 `style`、`class` 或 `--vmo-preview-code-height` 调整。

Markdown 默认使用 `markdown-it` 且禁用原始 HTML，支持表格、列表、引用、代码块。代码块使用等宽排版，未引入额外语法高亮器。自定义 `render` 返回的 HTML 由使用方负责转义和清理。

```ts
import MarkdownIt from 'markdown-it'
const parser = new MarkdownIt({ html: false, breaks: true })
const renderMarkdown = (content: string) => parser.render(content)
```

```vue
<VmoMarkdownPreview :content="markdown" :render="renderMarkdown" />
```

## 编辑器预览模式

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoDiffEditor, VmoMonacoUi, VmoMarkdownPreview } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'
const original = ref('# Original')
const proposal = ref('# Proposal')
const diffRef = ref()
</script>

<template>
  <VmoMonacoDiffEditor ref="diffRef"
    v-model:original-value="original" v-model:modified-value="proposal"
    :need-confirm="true"
    :monaco-options="{ language: 'markdown', theme: 'vs-light' }"
    style="height: 500px">
    <VmoMonacoUi :monaco="diffRef" :config="{ reviewActions: true }" />
    <template #preview="{ content, language, source, theme }">
      <VmoMarkdownPreview :content="content" :theme="theme" />
    </template>
  </VmoMonacoDiffEditor>
</template>
```

插槽参数：`content` 是内部当前草稿，包含未提交编辑；`language` 是当前语言；`source` 为 `original` 或 `modified`；`theme` 为当前主题。预览不会提交内容或替换两个 model。

未显式指定 `previewSource` 时，从正文进入预览默认显示正文；从提案／比对进入默认显示提案。显式 `previewSource` 初始化来源，并在外部实际变化时同步；外部值不变时，内部来源切换会保留，包括再次进入预览。状态行仅改变 editMode；预览来源按钮独立改变 previewSource，均不退出预览。

用 `v-model:view-mode` 与 `v-model:preview-source` 双向绑定，或用 `@update:view-mode="handleMode($event)"`、`@update:preview-source="handleSource($event)"` 仅接收通知。原有 `mode-change`、`preview-source-change` 保留。`needConfirm` 和 `bidibind` 不延迟这些状态更新。预览本身不提供编辑输入；`currentReadOnly` 描述编辑器视图的编辑限制。

自定义 `VmoMonacoUi` 默认插槽只替换上方控件，状态行及预览开关仍保留；`preview: false` 隐藏状态行预览开关。完全自建工具栏时可使用独立的 `VmoMonacoPreviewToggle`。

没有预览插槽时开关隐藏，初始 `viewMode="preview"` 回退到 edit；移除插槽也会退出预览并保留 editMode。

```ts
diffRef.value.togglePreview() // 再次切换回此前编辑视图
diffRef.value.changeViewMode('preview')
diffRef.value.changePreviewSource('original')
// 状态：hasPreview、currentPreviewSource
```

自定义工具栏中可加入 `<VmoMonacoPreviewToggle />`，也可传入 `monaco` 独立使用；默认插槽支持自定义按钮内容。

## 自定义样式

`class` / `style` 透传到根元素。文本和 Markdown 默认样式没有 `!important`，可在库 CSS 后加载应用样式，完全接管时设置 `unstyled`。

```vue
<VmoMarkdownPreview :content="markdown" class="my-article"
  style="--vmo-preview-font-size: 16px; --vmo-preview-padding: 24px" />
```

```css
.my-article {
  --vmo-preview-color: #334155;
  --vmo-preview-background: #f8fafc;
  --vmo-preview-line-height: 1.8;
}
/* Vue scoped 样式中用 .my-article :deep(h1) */
.my-article h1 { font-size: 1.6em; }
```

共有变量：`--vmo-preview-color`、`--vmo-preview-background`、`--vmo-preview-font-family`、`--vmo-preview-font-size`、`--vmo-preview-line-height`、`--vmo-preview-padding`。

Markdown 还支持 `--vmo-preview-block-gap`、`--vmo-preview-muted`、`--vmo-preview-border`、`--vmo-preview-link-color`、`--vmo-preview-code-font-family`、`--vmo-preview-code-background`。代码排版通过 `monacoOptions` 调整。


## 预览相关插槽

VmoTextPreview、VmoCodePreview、VmoMarkdownPreview 自身均没有插槽；传入 default 或具名插槽不会显示。用 content 传内容、用 render 自定义 Markdown 渲染、用 monacoOptions 配置代码预览。

VmoMonacoDiffEditor 的 preview 插槽接收 `{ content, language, source, theme }`，仅在预览模式渲染；无内置正文回退内容，因此需要自行放入预览组件或其它 renderer。它只替换预览内容区域，来源按钮及外层容器仍由编辑器提供。default、prefix、suffix 完整参数见[差异编辑器插槽](./api#vmomonacodiffeditor)。

VmoMonacoPreviewToggle 的 default 插槽接收 `{ active: boolean }`，只替换现有按钮的文字内容，外层图标、点击与可访问性属性保留。有可预览目标时才渲染；缺省文字为“预览”／“返回编辑器”，不要嵌套另一个按钮。

```vue
<VmoMonacoPreviewToggle :monaco="diffRef">
  <template #default="{ active }">
    <span>{{ active ? 'Return to editor' : 'Preview' }}</span>
  </template>
</VmoMonacoPreviewToggle>
```
