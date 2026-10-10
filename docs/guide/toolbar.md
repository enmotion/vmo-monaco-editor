# 工具栏与控件

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

在工具栏外使用控件时，直接传 `:monaco="editorRef"`。自定义默认插槽后，默认控件不会自动渲染，需要自行放入预览等控件。

导出的独立控件：`VmoMonacoCommitButton`、`VmoMonacoFontSizeInput`、`VmoMonacoFullscreenToggle`、`VmoMonacoLanguageSelect`、`VmoMonacoLineNumbersToggle`、`VmoMonacoMinimapToggle`、`VmoMonacoDiffReview`、`VmoMonacoThemeToggle`、`VmoMonacoPreviewToggle`。控件接受 `monaco`、`config`；具体值类型由对应 `VmoMonaco*ControlValue` 导出类型定义。

| 控件 | 事件 |
| --- | --- |
| 主题、全屏、小地图、行号、预览 | `update:value`、`toggle`、`commit` |
| 字号 | `update:value`、`update:modelValue`、`commit` |
| 语言 | `update:value`、`update:modelValue`、`change`、`commit` |
| 提交按钮 | `commit` |
| 差异审阅 | `accept-all`、`reject-all`、`confirm`、`accept-change`、`reject-change`、`display-mode-change`、`diff-view-mode-change` |

## 审阅菜单与插槽

审阅控件提供原文/提案/差异模式切换、差异块计数、内联/并排切换、全部接受/拒绝。计算中显示 `…`，计算未完成或没有差异时批量操作不可用。预览模式隐藏审阅布局和计数。

```vue
<VmoMonacoUi :monaco="diffRef" :config="{ reviewActions: true }">
  <template #review-actions="{ lineChanges, acceptAllChanges, rejectAllChanges, changeDisplayMode }">
    <button @click="changeDisplayMode('diff')">对比</button>
    <button @click="rejectAllChanges()">拒绝 {{ lineChanges.length }} 处修改</button>
    <button @click="acceptAllChanges()">全部接受</button>
  </template>
</VmoMonacoUi>
```

## 同时控制多个编辑器

传入 `:monaco="[primaryRef, secondaryRef]"`，字号、主题、语言、小地图和行号等控件操作应用于所有目标；全屏控件只切换第一个目标，预览与审阅控件仅操作符合条件的目标。提交按数组反向执行，第一个实例作为主要编辑器最后提交。

## 控件值与事件的含义

独立控件还接受 `value`，支持 `v-model:value`（字号、语言也发出 `update:modelValue`）。显式值优先于编辑器推导值，绑定后需要接收更新，否则显示状态会一直跟随旧的外部值。工具栏 `config` 负责显示哪些控件，不应当作为设置编辑器初始选项的入口；初始主题、字号等应放在 `monacoOptions`。

```vue
<VmoMonacoThemeToggle
  :monaco="editorRef"
  v-model:value="selectedTheme"
  @commit="onControlCommit" />
```

其中 `selectedTheme` 是应用定义的 `'vs-dark' | 'vs-light'` 响应式值。普通控件的 `commit` 是操作通知，参数结构为 `{ type, value?, config?, monacoCount }`，不表示代码保存完成，也不会自动调用编辑器 `commit()`。提交按钮会先调用目标编辑器的 `commit()`，再发出同结构的操作通知；差异审阅控件发出操作通知，与编辑器本身的内容事件负载不同，详见[完整 API](./api#vmomonacodiffreview)。

多实例控件通常以第一个目标的选项显示当前值，操作作用于所有目标；这不是多个状态的汇总。`null` 目标会被过滤。显式 `monaco` 目标优先于工具栏注入值；传 `null` 会回退到注入值。
