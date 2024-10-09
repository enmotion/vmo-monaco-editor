# vmo-monaco-editor

`vmo-monaco-editor` 是基于 [vue3](https://vuejs.org/) 对 [monaco-editor](https://microsoft.github.io/monaco-editor/) 的再次封装；可在 vue3 项目中，以组件的方式便捷的引入 `monaco-editor`

## 安装

```nodejs
npm i monaco-editor // current:0.33.0
npm i vmo-monaco-editor --save // install vmo-monaco-editor
```

## 插件环境配置

vite 配置方式

```
npm i vite-plugin-monaco-editor  -D // install vite-plugin-monaco-editor
```

vite.config

```ts
import { defineConfig } from 'vite' // 5.0
import vue from '@vitejs/plugin-vue' // 3.3.4
import monacoEditorPlugin from 'vite-plugin-monaco-editor' //1.1.0

export default defineConfig({
  ...
  plugins: [
    vue(),
    // 如果 vite.config 为 ts 则可能需要使用注释，vite-plugin-monaco-editor 的模块入口与类型声明不一致 导致的问题修复
    //@ts-ignore
    monacoEditorPlugin.default({
      languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'],
      ....
    })
    ...
  ],
})
```

## 使用方式

创建 componet.vue 单文件，此单例使用了 [tailwind.css](https://tailwindcss.com/)

```typescript
<script setup lang='ts'>
  import {ref} from 'vue';
  import { vmoMonacoEditor } from 'vmo-monaco-editor'; // 引入组件
  import 'vmo-monaco-editor/dist/style.css'; // 引入组件外观样式
  const codeContent = ref('SELECT * FROM table_name');
</script>

<template>
  <div class="flex flex-row grow-1 h-full">
    <div class="flex-col flex flex-grow w-0 bg-white border p-[10px]">
      <textarea v-model="codeContent" class="border h-[200px]" :rows="4" />
    </div>
    <vmo-monaco-editor
      :model-value="codeContent"
      prefix="function(name){"
      :option-config="{
        theme: 'vs-dark',
        language: 'sql'
      }"
      class="w-[800px]"
      @update:modeValue="codeContent = $event"
      @change="codeContent = $event">
    </vmo-monaco-editor>
  </div>
</template>

```

## 组件属性与事件

实例属性

```ts
props: {
  prefix: {
    // 前置内容
    type: String as PropType<string>,
    default: '(()=>{})'
  },
  modelValue: {
    // 代码内容
    type: String as PropType<string>,
    default: 'const aa:number = 12;'
  },
  suffix: {
    // 后置内容
    type: String as PropType<string>,
    default: '};'
  },
  needConfirm: {
    // 是否需要触发确认才能提交代码
    type: Boolean as PropType<boolean>,
    default: false
  },
  bidibind: {
    // 是否双向绑定，当 props.modelValue 在外部发生变化时，也会同步触发代码编辑内容变化
    type: Boolean as PropType<boolean>,
    default: true
  },
  zIndex: {
    // 全屏模式时，其z-index 的值
    type: Number as PropType<number>,
    default: 99
  },
  remindConfig: {
    // 提示词配置
    type: Array as PropType<{ language?: 'sql' | 'python' | 'groovy'; extra: Partial<VmoMonacoContext> }[]>,
    default: () => []
  },
  disabled: {
    // 是否禁用
    type: Boolean as PropType<boolean>,
    default: false
  },
  monacoOptions: {
    // monaco-editor 配置
    type: Object as PropType<
      Partial<Monaco.editor.IStandaloneEditorConstructionOptions & { theme: 'vs-dark' | 'vs-light' }>
    >,
    default: () => ({})
  }
},
```

实例事件

```ts
emits: ['update:modelValue', 'change', 'focuse', 'blur'],

// 前提:props.needConfirm:false
updata:modelValue:($event:string)=>any // v-model 的实现,返回当前编写的代码
// 前提:props.needConfirm:false
change:($event:string)=>any // 时失焦后触发代码内容提交,返回当前编写的代码，

focues // 获得焦点事件
blur // 失去焦点事件
```

实例插槽

```
<template #default></template>
<template #prefix></template>
<template #suffix></template>
```

实例方法

```ts
instance.insertCodeString(code:string) // 在当前光标位置插入代码 code
instance.fullscreenSwitch() // 全屏模式切换
instance.resetMonacoEditorOptions(options: Partial<Monaco.editor.IStandaloneEditorConstructionOptions>) // 将重制 MonacoEditor的配置 运行时更改
instance.refreshMonacoEditor() // 刷新
instance.changeLanguage(language:string) // 切换语言
instance.commit() // 外部主动触发提交内部编写的代码
```
