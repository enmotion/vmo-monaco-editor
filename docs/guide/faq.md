# 常见问题与发布

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


## 编辑器没有显示

先确认引入 `vmo-monaco-editor/dist/style.css`，并给组件设置有效高度，例如 `style="height: 400px"`。容器在隐藏标签页中初始化时，可在显示后检查布局，必要时调用 `refreshMonacoEditor()`。

## Worker 请求失败

检查 Vite 的 Monaco worker 插件是否安装并启用，生产环境 worker 文件是否实际部署，以及 worker URL 是否包含应用的 `base` 子路径。代码预览也依赖这些 workers。

## 修改内容没有同步

检查 `needConfirm` 是否为 `true`。此模式应通过提交按钮或 `commit()` 更新外部绑定。`bidibind=false` 则会阻止外部值变化传入内部 model。普通编辑器的 `change` 默认在失焦时发出，并非每个键入动作。

## 状态切换后父组件没有变化

默认工具栏通过编辑器 API 改变内部状态；`VmoMonacoUi` 不转发控件交互事件。请在编辑器上使用 `v-model:edit-mode`、`v-model:preview-source`、`v-model:diff-view-mode`、`v-model:monaco-options`、`v-model:diff-options` 和 `v-model:full-screen`，或监听对应 `update:*` 并读取 `$event`。普通编辑器支持 `view-mode`、`monaco-options` 和 `full-screen`，不提供差异内容选择。

父组件不回写时，内部切换仍然生效；外部值实际变化才覆盖内部状态。重新赋相同值不构成外部变化，等价选项对象不会重置内部选择。`needConfirm`／`bidibind` 不控制这些状态事件。独立设置控件使用 `v-model:value`，字号与语言也支持 `v-model`。详见[工具栏状态绑定](./toolbar#状态双向绑定)。

## 为什么确认后还是原文

diff 的 `confirmedValue` 是原文 model。确认只提交当前状态，不会自动接受提案。先接受需要的差异，再确认。

## 主题影响了其他编辑器

Monaco 主题是全局状态，切换某个实例的主题会影响页面内其他 Monaco 实例。全屏通过 `Teleport` 移到 `body`，避免父元素裁剪；用 `zIndex` 调整层级。

## SSR / VitePress 集成

Monaco 依赖浏览器，避免在服务端直接静态导入组件库。将编辑器写在独立 Vue 文件中，通过客户端生命周期动态加载：

```vue
<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
const EditorDemo = shallowRef()
onMounted(async () => {
  EditorDemo.value = (await import('./EditorDemo.vue')).default
})
</script>

<template>
  <component :is="EditorDemo" v-if="EditorDemo" />
</template>
```

`EditorDemo.vue` 中使用快速开始的完整示例，并配置客户端 workers。只使用 `<ClientOnly>` 包住静态导入的 Monaco 不足以避免模块在服务端求值。

## 文档本地开发

```bash
npm ci
npm run docs:dev
npm run docs:build
npm run docs:preview
```

文档源码在 `docs/guide` 和 `docs/en`。中文入口为 `/`，英文入口为 `/en/`，站点根入口也展示中文首页。导航支持语言切换和本地全文搜索。

## GitHub Pages 自动发布

工作流在 `.github/workflows/docs.yml`，推送到 `master` 或手动触发会执行构建并发布 `docs/.vitepress/dist`。在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

站点地址：[enmotion.github.io/vmo-monaco-editor](https://enmotion.github.io/vmo-monaco-editor/)。仓库子路径由 `docs/.vitepress/config.mts` 中的 `base: '/vmo-monaco-editor/'` 配置；改仓库名或使用自定义域名时需同步调整。

发布流程参照 [VitePress 官方部署文档](https://vitepress.dev/guide/deploy)。失败时查看仓库 Actions 的构建和部署日志。
