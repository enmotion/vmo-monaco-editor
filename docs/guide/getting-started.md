# 快速开始

props、emit 与完整实例成员清单见[组件 API 完整参考](./api)。

`vmo-monaco-editor` 是 Vue 3 的 Monaco 编辑器组件库，提供代码编辑、原文/提案差异审阅、独立工具栏控件以及文本、代码、Markdown 预览。本文档对应仓库当前的 `0.1.6` 源码；使用已发布 npm 包时，请核对该版本是否包含所需的新功能。

## 安装

```bash
npm install vue@^3.3.4 monaco-editor@^0.33.0 ramda@^0.30.1 vmo-monaco-editor
npm install -D vite-plugin-monaco-editor
```

Vue、Monaco 和 Ramda 是 peer dependencies。下面配置适用于 Vite + Vue 项目。

## 配置 Monaco workers

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  plugins: [
    vue(),
    // 该插件的 CommonJS 导出在本项目使用 .default
    // @ts-ignore
    monacoEditorPlugin.default({
      languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript']
    })
  ]
})
```

若你安装的插件版本直接导出函数，请按其导出形式调用。部署在子路径时，检查 worker 请求地址是否同样包含站点前缀。

## 第一个编辑器

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoUi } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'

const code = ref('const message = "Hello Monaco"')
const editorRef = ref()
</script>

<template>
  <VmoMonacoEditor
    ref="editorRef"
    v-model="code"
    prefix=""
    suffix=""
    :monaco-options="{ language: 'javascript', theme: 'vs-light', fontSize: 14 }"
    style="height: 400px">
    <VmoMonacoUi :monaco="editorRef" title="JavaScript" />
  </VmoMonacoEditor>
</template>
```

必须给编辑器设置有效高度；示例使用普通 CSS，不依赖应用安装 Tailwind。全局引入一次库的样式即可。`prefix` 和 `suffix` 设置为空字符串会隐藏默认的外围展示内容。

## 选择组件

| 需求 | 组件 |
| --- | --- |
| 编辑一段代码 | `VmoMonacoEditor` |
| 对比原文和提案，接受或拒绝修改 | `VmoMonacoDiffEditor` |
| 配置主题、语言、字号、全屏等 | `VmoMonacoUi` 与独立控件 |
| 展示纯文本 | `VmoTextPreview` |
| 只读代码高亮 | `VmoCodePreview` |
| 渲染 Markdown | `VmoMarkdownPreview` |

Monaco 依赖浏览器环境。SSR 应用需要在客户端动态导入含编辑器的组件，详见[常见问题](./faq)。
