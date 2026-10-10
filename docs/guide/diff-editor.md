# 差异编辑与审阅

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
    display-mode="diff" diff-view-mode="inline"
    :editable-original="true" :editable-modified="true"
    :monaco-options="{ language: 'plaintext', theme: 'vs-light', wordWrap: 'on' }"
    style="height: 500px">
    <VmoMonacoUi :monaco="diffRef" title="Review"
      :config="{ reviewActions: true, commit: true, theme: true, fullScreen: true }" />
  </VmoMonacoDiffEditor>
</template>
```

## 提交语义

`needConfirm=true` 时，普通编辑与接受/拒绝操作只修改内部 model，不立即发出两个 `update:*` 事件；审阅事件仍然会发出。`confirm()` 或 `commit()` 提交当前两个 model，并发出 `confirm`；其中 `confirmedValue` 是当前 **original** 内容。

确认不会自动接受剩余提案。如果要保存所有提案内容，应先等待差异计算完成，调用 `acceptAllChanges()`，再调用 `confirm()`。接受/拒绝不等于后端持久化。

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `originalValue` | `string` | `''` | `v-model:original-value` |
| `modifiedValue` | `string` | `''` | `v-model:modified-value` |
| `prefix` / `suffix` | `string` | `''` | model 外的展示内容 |
| `displayMode` | `'original' \| 'modified' \| 'diff' \| 'preview'` | `'diff'` | 当前显示模式 |
| `previewSource` | `'original' \| 'modified'` | 未设置 | 指定预览来源 |
| `diffViewMode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | 差异布局 |
| `editableOriginal` | `boolean` | `false` | 允许编辑原文 |
| `editableModified` | `boolean` | `true` | 允许编辑提案 |
| `needConfirm` | `boolean` | `false` | 手动提交 |
| `bidibind` | `boolean` | `true` | 同步外部值 |
| `disabled` | `boolean` | `false` | 只读编辑视图 |
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
| `update:originalValue` | `string` | 原文更新/提交 |
| `update:modifiedValue` | `string` | 提案更新/提交 |
| `change` | `pair` | 当前两个 model 的内容 |
| `accept-change` / `reject-change` | `pair & { index?: number; lineChange?: ILineChange }` | 单个差异块接受/拒绝 |
| `accept-all` / `reject-all` | `pair` | 批量接受/拒绝 |
| `confirm` | `pair & { confirmedValue: string }` | 确认当前原文 |
| `mode-change` | 显示模式字符串 | 模式切换 |
| `preview-source-change` | `'original' \| 'modified'` | 预览来源切换 |
| `focuse` / `blur` | 无 | 焦点变化，保留 `focuse` 拼写 |

## 实例 API

```ts
diffRef.value.changeDisplayMode('diff')
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
diffRef.value.resetMonacoDiffEditorOptions({ renderSideBySide: false })
diffRef.value.changeLanguage('markdown')
diffRef.value.fullscreenSwitch()
diffRef.value.refreshMonacoEditor()
```

还可读取 `currentDisplayMode`、`currentDiffViewMode`、`lineChanges`、`diffPending`、`computedMonacoEditorOption` 和 `isFullScreen`。切换视图保持两个 model；差异异步计算时不要使用过时的差异索引。原文/提案单视图仍会通过脱离显示容器的 diff 实例计算差异。

默认、`prefix`、`suffix` 插槽与普通编辑器相同。`#preview` 与相关 API 见[预览组件](./preview)。
