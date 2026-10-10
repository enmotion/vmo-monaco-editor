# 预览组件

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

从原文进入预览默认显示原文；从提案/差异进入默认显示提案。可以通过来源按钮或 `previewSource` 指定来源。没有预览插槽时开关隐藏，初始 `displayMode="preview"` 回退到提案；移除插槽也会退出预览。

```ts
diffRef.value.togglePreview() // 再次切换回此前编辑视图
diffRef.value.changeDisplayMode('preview')
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
