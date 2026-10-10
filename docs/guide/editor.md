# 普通编辑器

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

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `'//code content gose here...'` | 编辑内容，支持 `v-model` |
| `prefix` | `string` | `'(()=>{})'` | 编辑器上方展示内容，不进入 model |
| `suffix` | `string` | `'};'` | 编辑器下方展示内容，不进入 model |
| `needConfirm` | `boolean` | `false` | 延迟提交内容 |
| `bidibind` | `boolean` | `true` | 同步外部内容变更 |
| `disabled` | `boolean` | `false` | 设置 Monaco 为只读 |
| `zIndex` | `number` | `99` | 全屏容器层级 |
| `monacoOptions` | `VmoMonacoEditorOption` | `{}` | Monaco 配置增量 |
| `remindConfig` | `{ language?: 'sql' \| 'python' \| 'groovy'; extra: Partial<VmoMonacoContext> }[]` | `[]` | 自定义补全配置 |

默认 Monaco 配置为 `automaticLayout: true`、`theme: 'vs-dark'`、`language: 'typescript'`、`lineNumbers: 'on'`、`fontSize: 12`、`minimap: { enabled: true }`。传入配置与默认配置深度合并。

## 事件

| 事件 | 参数 | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `string` | 实时编辑或 `commit()` |
| `change` | `string` | 默认失焦，或 `commit()` |
| `focuse` | 无 | 编辑器获得焦点，名称确实拼写为 `focuse` |
| `blur` | 无 | 编辑器失去焦点 |

## 实例方法与状态

```ts
editorRef.value.insertCodeString('SELECT ') // 在当前光标位置插入
editorRef.value.resetMonacoEditorOptions({ fontSize: 16 })
editorRef.value.changeLanguage('sql')
editorRef.value.fullscreenSwitch()
editorRef.value.refreshMonacoEditor() // 保留内部文本，重建编辑器
editorRef.value.commit()
```

实例还提供 `innerValue`、`computedMonacoEditorOption` 和 `isFullScreen`。公开的 `VmoMonacoEditorExpose` 类型没有列出 `insertCodeString` 和 `innerValue`；需要这些成员时可使用 Vue 的组件实例类型。

## 插槽

默认插槽用于工具栏。`prefix` / `suffix` 插槽接收 `{ option }`，可替代对应展示区域。

```vue
<template #prefix="{ option }">
  <span>当前语言：{{ option.language }}</span>
</template>
```

字符串 `prefix` / `suffix` 使用 `v-html` 渲染，只应传入可信内容。普通文本可用插槽和 Vue 插值显示。
