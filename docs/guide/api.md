# 组件 API 完整参考

[English version](../en/guide/api)

本文逐项对应当前源码导出的 15 个组件。所有 props 均可省略；模板中可使用 kebab-case。组件 ref 在挂载前为 `null`，表中的响应式状态在组件实例上已自动解包。方法未特别注明时返回 `void`。

组件没有使用 `expose()` 限定实例：props 及 `setup()` 返回成员均可通过 ref 访问。下文列出全部返回成员；内部辅助成员仅解释用途，建议通过公开方法修改状态。Vue 自带的 `$el`、`$props` 等不属于库专有 API。

类型简写：`Option` = `VmoMonacoEditorOption`，`Target` = `VmoMonacoControlTarget`，`Pair` = `{ originalValue: string; modifiedValue: string }`，`Mode` = `original | modified | diff | preview`，`ViewMode` = `side-by-side | inline`，`Source` = `original | modified`，`Theme` = `vs-dark | vs-light`。枚举值均为字符串。

## VmoMonacoEditor

### Props

| `属性` | 类型 | 默认值 | 说明 |
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

### Emits

| `事件` | 参数 | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `string` | 实时编辑或 `commit()` |
| `change` | `string` | 默认失焦，或 `commit()` |
| `focuse` | 无 | 编辑器获得焦点，名称确实拼写为 `focuse` |
| `blur` | 无 | 编辑器失去焦点 |

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `computedMonacoEditorOption` | Option | 默认配置与内部配置合并后的当前配置 |
| `isFullScreen` | boolean | 当前全屏状态，初始 false |
| `innerValue` | string | 内部草稿，包括未提交编辑 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `insertCodeString(codeString: string)` | 在光标处插入，不替换选区；无光标时不执行 |
| `resetMonacoEditorOptions(options: Option)` | 深度合并配置，后续通过 watcher 更新 Monaco |
| `fullscreenSwitch()` | 切换当前组件容器全屏状态 |
| `changeLanguage(language: string)` | 更新 model 语言和内部配置 |
| `refreshMonacoEditor()` | 重建 editor；模型保留规则见使用指南 |
| `commit()` | 提交内部值；普通编辑器发出 update:modelValue 和 change，diff 等同 confirm |


### 其他可访问成员

| `成员` | 类型 | 说明 |
| --- | --- | --- |
| `context` | SetupContext | Vue 插槽、attrs 和 emit 上下文，内部辅助 |
| `MonacoEditorRef` | HTMLElement / null | Monaco 挂载 DOM，内部辅助 |
| `monacoEditorOptions` | Option | 内部配置增量；通过 resetMonacoEditorOptions 修改 |
| `mergeDeepRight(a, b)` | 函数 | Ramda 深度合并辅助函数，返回合并结果；不是编辑器操作 API |


详见[普通编辑器](./editor)。

## VmoMonacoDiffEditor

实时模式下，每侧内容变化分别发出对应 `update:*`；失焦发出 `change`。审阅操作在下一 tick 发出审阅事件，并在非确认模式下提交两个值及 `change`。`confirm()` / `commit()` 不等待差异计算，立即提交当前内容。diff 双栏的焦点事件绑定提案侧；单视图绑定当前显示侧。

### Props

| `属性` | 类型 | 默认值 | 说明 |
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

### Emits

以下用 `pair` 表示 `{ originalValue: string; modifiedValue: string }`。

| `事件` | 参数 | 说明 |
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

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `computedMonacoEditorOption` | Option | 默认配置与内部配置合并后的当前配置 |
| `isFullScreen` | boolean | 当前全屏状态，初始 false |
| `currentDisplayMode` | Mode | 当前实际模式，可能因缺少预览插槽而回退 |
| `currentDiffViewMode` | ViewMode | 当前并排/内联布局 |
| `hasPreview` | boolean | 是否存在 preview 插槽 |
| `currentPreviewSource` | Source | 当前预览来源 |
| `modifiedInnerValue` | string | 内部提案草稿；原文缓存 originalInnerValue 未返回，不可直接访问 |
| `previewContent` | string | 当前来源的内部草稿 |
| `previewLanguage` | string | 当前配置语言，回退 plaintext |
| `lineChanges` | Monaco.editor.ILineChange[] | 最新有效差异块，计算中不代表最终结果 |
| `diffPending` | boolean | 是否等待最新比较结果，初始 true |
| `showReviewActions` | boolean | setup 返回的是初始 prop 快照 |
| `needConfirm` | boolean | setup 返回的是初始 prop 快照；行为本身仍读取响应式 prop |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `resetMonacoEditorOptions(options: Option)` | 深度合并配置，后续通过 watcher 更新 Monaco |
| `fullscreenSwitch()` | 切换当前组件容器全屏状态 |
| `changeLanguage(language: string)` | 更新 model 语言和内部配置 |
| `refreshMonacoEditor()` | 重建 editor；模型保留规则见使用指南 |
| `commit()` | 提交内部值；普通编辑器发出 update:modelValue 和 change，diff 等同 confirm |
| `resetMonacoDiffEditorOptions(options: Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>)` | 深度合并 diff 选项；布局和编辑权限仍由专用 props/状态控制 |
| `changeDisplayMode(mode: Mode)` | 切换视图；preview 要求提供插槽；实际变化时发出 mode-change |
| `changeDiffViewMode(mode: ViewMode)` | 切换 diff 布局，不发出编辑器级布局事件 |
| `changePreviewSource(source: Source)` | 切换预览来源；实际变化时发出 preview-source-change |
| `togglePreview()` | 进入预览或返回此前编辑模式；无插槽时不进入 |
| `acceptChange(index: number)` | 接受当前差异块，零基索引；结果无效时不执行 |
| `rejectChange(index: number)` | 拒绝当前差异块，零基索引；结果无效时不执行 |
| `acceptAllChanges()` | 完整复制 modified 到 original，不检查 diffPending |
| `rejectAllChanges()` | 完整复制 original 到 modified，不检查 diffPending |
| `confirm()` | 依次发出两个 update 事件、change、confirm；confirmedValue 为原文 |
| `getLineChanges(): Monaco.editor.ILineChange[]` | 读取当前有效差异块，不等待异步计算 |
| `getOriginalEditor(): Monaco.editor.IStandaloneCodeEditor / null` | 获取显示中的原文 editor |
| `getModifiedEditor(): Monaco.editor.IStandaloneCodeEditor / null` | 获取显示中的提案 editor |
| `getDiffEditor(): Monaco.editor.IStandaloneDiffEditor / null` | 获取显示中的 diff editor，后台实例不返回 |


### 其他可访问成员

| `成员` | 类型 | 说明 |
| --- | --- | --- |
| `context` | SetupContext | Vue 插槽、attrs 和 emit 上下文，内部辅助 |
| `MonacoEditorRef` | HTMLElement / null | Monaco 挂载 DOM，内部辅助 |
| `monacoEditorOptions` | Option | 内部配置增量；通过 resetMonacoEditorOptions 修改 |
| `mergeDeepRight(a, b)` | 函数 | Ramda 深度合并辅助函数，返回合并结果；不是编辑器操作 API |


详见[差异编辑与审阅](./diff-editor)。

## VmoMonacoUi

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | string | VMO:Editor | 标题 |
| `monaco` | Target | null | 注入控件的编辑器目标 |
| `config` | `Partial<MonacoUIConfig>` | 见下方 | 替代默认配置对象，不与默认值合并 |

`MonacoUIConfig` 仅在组件源码导出，没有从包根入口导出；可用组件 props 类型推导配置。

默认 config：

```ts
{ fontSize: true, theme: true, minimap: true, lineNumbers: true, fullScreen: true,
  languages: ['css', 'html', 'json', 'javascript', 'typescript'] }
```

| `键` | 类型 | 说明 |
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

### Emits 与实例方法

没有自定义 emit，也没有返回实例方法。内部控件事件不会由 UI 自动转发；需要监听时使用自定义默认插槽中的控件。

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `theme` | Theme | 第一个目标的主题，回退 vs-light |
| `monacoNeedConfirm` | boolean | 是否有目标需要手动提交 |
| `languageVisible` | boolean | 语言列表多于一项且未显式隐藏 |
| `languageControlConfig` | `{ languages?: string[] } / undefined` | 解析后的语言配置 |
| `fontSizeControlConfig` | `{ min?: number; max?: number; step?: number } / undefined` | 解析后的字号配置 |
| `themeControlConfig` | Theme / undefined | 解析后的主题配置 |
| `lineNumbersControlConfig` | on / off / undefined | 解析后的行号配置 |
| `reviewActionsControlConfig` | boolean | 是否启用审阅控件 |


## 独立控件的公共约定

### 公共 Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `monaco` | Target | null | 显式目标优先；null 回退工具栏注入 |
| `value` | 各控件值类型 | undefined | 外部显示值，支持 v-model:value；不是自动修改目标的命令 |
| `config` | 各控件配置类型 | undefined | 专用配置，见每个控件 |

以下各控件均包含这三个 props。`commit` 通知的公共参数为 `{ type: string; value?: TValue; config?: TConfig; monacoCount: number }`。除提交按钮外，此事件不调用编辑器提交。

## VmoMonacoCommitButton

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | unknown | undefined | 公共受控值 |
| `config` | boolean | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `commit` | 公共通知，type=commit | 目标 commit 调用后 |


### 实例属性

没有额外返回的状态属性（props 仍可读取）。

### 实例方法

| `签名` | 说明 |
| --- | --- |
| `handleCommit()` | 反向调用所有目标 commit，再发出 commit；type=commit |


## VmoMonacoFontSizeInput

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | number | undefined | 公共受控值 |
| `config` | `{ min?: number; max?: number; step?: number }` | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |
| `modelValue` | number | undefined | v-model 兼容值，优先级低于 value |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | number | 输入/选择后 |
| `update:modelValue` | number | 同一次操作中，兼容 v-model |
| `commit` | 公共通知，type=fontSize | 上述值事件之后 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `inputConfig` | `{ min: number; max: number; step: number }` | 合并默认 min=6、max=100、step=1 |
| `currentValue` | number | value、modelValue、首个目标 fontSize、12 中首个真值；0 会回退 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `handleInput(event: Event)` | 从 event.target.value 转为 Number，更新所有目标字号，再发出两个 update 及 commit；min/max 是输入属性，方法不额外钳制数值 |


## VmoMonacoLanguageSelect

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | string | undefined | 公共受控值 |
| `config` | `{ languages?: string[] }` | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |
| `modelValue` | string | undefined | v-model 兼容值 |
| `languages` | string[] | [] | config.languages 未设置时使用 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | string | 输入/选择后 |
| `update:modelValue` | string | 同一次操作中，兼容 v-model |
| `change` | string | 语言选择后 |
| `commit` | 公共通知，type=language | 上述值事件之后 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `currentLanguages` | string[] | config.languages 优先于 languages |
| `currentValue` | string | value、modelValue、首个目标 language、空字符串中首个真值 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `handleChange(event: Event)` | 读取 event.target.value，调用所有目标 changeLanguage，再发出两个 update、change 和 commit |


## VmoMonacoThemeToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | Theme | undefined | 公共受控值 |
| `config` | Theme | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |
| `theme` | Theme | undefined | 兼容主题值，优先级低于 value |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | Theme | 切换操作后 |
| `toggle` | Theme | 与 update:value 同值 |
| `commit` | 公共通知，type=theme | 值事件之后 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `currentTheme` | Theme | value → theme → 首个目标主题 → config → vs-light |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleTheme()` | 切换 vs-dark/vs-light，更新所有目标并发出 update:value、toggle、commit |


## VmoMonacoFullscreenToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | boolean | undefined | 公共受控值 |
| `config` | boolean | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |
| `isFullScreen` | boolean | undefined | 兼容状态；false 仍可回退目标状态 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | boolean | 切换操作后 |
| `toggle` | boolean | 与 update:value 同值 |
| `commit` | 公共通知，type=fullScreen | 值事件之后 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `currentValue` | boolean | 布尔 value → 布尔 config → isFullScreen 或首个目标状态 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleFullScreen()` | 仅切换第一个目标；无目标不执行也不发事件；发出 update:value、toggle、commit |


## VmoMonacoLineNumbersToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | on / off | undefined | 公共受控值 |
| `config` | on / off | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | on / off | 切换操作后 |
| `toggle` | on / off | 与 update:value 同值 |
| `commit` | 公共通知，type=lineNumbers | 值事件之后 |


### 实例属性

没有额外返回的状态属性（props 仍可读取）。

### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleLineNumbers()` | 依据 value → config → 首个目标 lineNumbers → on 切换；更新所有目标并发出三个事件；currentValue 未返回到实例 |


## VmoMonacoMinimapToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | boolean | undefined | 公共受控值 |
| `config` | boolean | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | boolean | 切换操作后 |
| `toggle` | boolean | 与 update:value 同值 |
| `commit` | 公共通知，type=minimap | 值事件之后 |


### 实例属性

没有额外返回的状态属性（props 仍可读取）。

### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleMinimap()` | 布尔 value → 布尔 config → 首个目标 minimap.enabled 决定当前值；更新所有目标并发出三个事件；currentValue 未返回 |


## VmoMonacoPreviewToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | boolean | undefined | 公共受控值 |
| `config` | boolean | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | boolean | 切换操作后 |
| `toggle` | boolean | 与 update:value 同值 |
| `commit` | 公共通知，type=preview | 值事件之后 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `previewMonacos` | VmoMonacoDiffEditorExpose[] | 过滤出有预览插槽和预览方法的目标 |
| `currentValue` | boolean | 布尔 value 优先，否则读取首个有效目标是否处于 preview |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `togglePreview()` | 统一进入/退出所有有效目标；无有效目标不执行也不发事件；config 只随通知传出，不决定显示或状态 |


## VmoMonacoDiffReview

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `monaco` | Target | null | 过滤出支持 diff 审阅方法的目标 |
| `value` | unknown | undefined | 仅附加到控件事件负载，不决定审阅状态 |
| `config` | boolean | undefined | 仅附加到事件负载，不控制独立控件显示 |


### Emits

这些是**控件操作通知**，不是 diff 编辑器的内容事件。方法调用目标后同步发出通知，即使目标因差异过期而忽略操作，也可能发出；确认保存应监听 diff 编辑器本身的 `confirm`。

```ts
type ReviewControlPayload = {
  type: string
  value: unknown
  config: boolean | undefined
  monacoCount: number // 有效 diff 目标数量
  index: number | undefined
  lineChanges: Monaco.editor.ILineChange[] // 首个目标当前结果，可能正在重新计算
  mode?: VmoMonacoDiffDisplayMode | VmoMonacoDiffViewMode
}
```

### 事件列表

| `事件` | 参数与说明 |
| --- | --- |
| `accept-all` | ReviewControlPayload；调用全部接受 |
| `reject-all` | ReviewControlPayload；调用全部拒绝 |
| `confirm` | ReviewControlPayload；调用所有目标 confirm |
| `accept-change` | ReviewControlPayload；index 为传入的零基索引 |
| `reject-change` | ReviewControlPayload；index 为传入的零基索引 |
| `display-mode-change` | ReviewControlPayload；mode 为显示模式；preview 仅应用于有插槽的目标 |
| `diff-view-mode-change` | ReviewControlPayload；mode 为 diff 布局 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `ReviewActionsRef` | HTMLElement / null | 菜单根 DOM，内部点击外部关闭逻辑使用 |
| `isOpen` | boolean | 菜单是否展开，初始 false |
| `lineChanges` | Monaco.editor.ILineChange[] | 首个 diff 目标的差异块，回退 [] |
| `diffPending` | boolean | 首个目标计算状态，回退 false |
| `canReview` | boolean | 非计算中且有差异；默认批量按钮使用 |
| `currentDisplayMode` | Mode | 首个目标模式，回退 diff |
| `hasPreview` | boolean | 首个目标是否有预览插槽，回退 false |
| `currentDiffViewMode` | ViewMode | 首个目标布局，回退 side-by-side |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `togglePanel()` | 切换弹层及 document 点击监听，不发事件 |
| `acceptChange(index: number)` | 对所有有效目标调用单块接受，之后发出控件通知 |
| `rejectChange(index: number)` | 对所有有效目标调用单块拒绝，之后发出控件通知 |
| `acceptAllChanges()` | 对所有有效目标调用全部接受 |
| `rejectAllChanges()` | 对所有有效目标调用全部拒绝 |
| `confirm()` | 对所有有效目标确认 |
| `changeDisplayMode(mode: Mode)` | 同步显示模式 |
| `changeDiffViewMode(mode: ViewMode)` | 同步 diff 布局 |

这些方法本身不检查 `canReview`；自定义菜单应自行禁用不适用的操作。`closePanel` 和目标列表没有返回到组件实例。默认插槽提供 `lineChanges`、`diffPending`、`currentDisplayMode`、`hasPreview` 以及上述审阅/模式方法（不含 togglePanel）；UI 的 `review-actions` 插槽转发同一组参数。

## VmoTextPreview

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | string | '' | 响应式展示内容 |
| `theme` | Theme | vs-light | 预览主题 |
| `unstyled` | boolean | false | 移除默认排版，仍保留换行 |


### Emits 与实例方法

没有自定义 emit，没有返回实例方法。

### 实例属性

没有额外返回的状态属性。

## VmoCodePreview

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | string | '' | 响应式展示内容 |
| `theme` | Theme | vs-light | 预览主题 |
| `language` | string | plaintext | model 语言 |
| `monacoOptions` | VmoCodePreviewOptions | `{}` | 可选 Monaco 配置；内容/model/语言/主题/只读由组件管理 |


### Emits 与实例方法

没有自定义 emit，没有返回实例方法。

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `container` | HTMLElement / null | 预览挂载 DOM；不暴露内部 editor 或 model |


## VmoMarkdownPreview

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | string | '' | 响应式展示内容 |
| `theme` | Theme | vs-light | 预览主题 |
| `unstyled` | boolean | false | 移除默认排版 |
| `render` | (content: string) =&gt; string | undefined | 同步返回可信 HTML；未提供时使用内置 markdown-it |


### Emits 与实例方法

没有自定义 emit，没有返回实例方法。

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `renderedContent` | string | 当前渲染 HTML，包括自定义渲染结果 |


## 使用组件 ref

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VmoMonacoEditor, VmoMonacoFontSizeInput } from 'vmo-monaco-editor'
import 'vmo-monaco-editor/dist/style.css'
const code = ref('SELECT * FROM users')
const editorRef = ref<InstanceType<typeof VmoMonacoEditor> | null>(null)
const sizeRef = ref<InstanceType<typeof VmoMonacoFontSizeInput> | null>(null)
const fontSize = ref(14)
</script>

<template>
  <VmoMonacoEditor ref="editorRef" v-model="code" prefix="" suffix=""
    :need-confirm="true" :monaco-options="{ language: 'sql' }"
    style="height: 400px" @change="value => console.log(value)" />
  <VmoMonacoFontSizeInput ref="sizeRef" :monaco="editorRef" v-model="fontSize"
    :config="{ min: 10, max: 32, step: 1 }" />
  <button @click="editorRef?.commit()">提交草稿</button>
</template>
```

`VmoMonacoEditorExpose` / `VmoMonacoDiffEditorExpose` 是工具栏目标使用的接口子集，并未枚举全部运行时成员；需要完整实例时使用上面的 `InstanceType`。diff 的 `needConfirm` / `showReviewActions` 同名返回值是初始快照，当前 prop 可从 `$props` 读取。不要把修改实例字段当作修改父组件 prop。
