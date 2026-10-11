# 组件 API 完整参考

状态变化不依赖外部监听或回写。内部操作立即生效并 emit `update:*`；外部 props 实际改变时同步内部状态。可以使用 `v-model:*` 双向绑定，也可以通过 `@update:*` 获取 `$event` 而不回写。`viewMode`、`editMode`、`previewSource`、`diffViewMode`、`fullScreen` 各有独立更新事件；主题、字号、语言通过 `update:monacoOptions` 一起回传。


## 独立的视图状态与内容状态

两个编辑器都提供 `viewMode: 'edit' | 'preview'`，支持 `v-model:view-mode`、`update:viewMode` 与 `view-mode-change`。差异编辑器另提供 `editMode: 'original' | 'modified' | 'diff'`，支持 `v-model:edit-mode`、`update:editMode` 与 `edit-mode-change`。改变任一状态不会改变另一状态。`diffViewMode` 仅表示比对布局，`previewSource` 仅表示预览草稿来源。props 初始化内部状态，外部实际改变时同步；外部不回写则保留内部操作结果。

两个编辑器的插槽一致：`default`、`prefix`、`preview`、`suffix`。preview 参数为 `{ content, language, source, theme }`，普通编辑器的 source 固定为 original。没有 preview 插槽时无法进入预览；移除插槽会返回 edit，保留差异编辑器的 editMode。普通编辑器切换时保留 Monaco 实例和草稿。

库导出 `VmoMonacoEditorSlots<Source>` 插槽类型，默认 Source 为 `original | modified`；普通编辑器使用 `VmoMonacoEditorSlots<'original'>`。各插槽为可选函数，参数对象本身不包含 undefined，支持模板中直接解构 `{ content, theme }`。

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


[English version](../en/guide/api)

本文逐项对应当前源码导出的 15 个组件。所有 props 均可省略；模板中可使用 kebab-case。组件 ref 在挂载前为 `null`，表中的响应式状态在组件实例上已自动解包。方法未特别注明时返回 `void`。

组件没有使用 `expose()` 限定实例：props 及 `setup()` 返回成员均可通过 ref 访问。下文列出全部返回成员；内部辅助成员仅解释用途，建议通过公开方法修改状态。Vue 自带的 `$el`、`$props` 等不属于库专有 API。

类型简写：`Option` = `VmoMonacoEditorOption`，`Target` = `VmoMonacoControlTarget`，`Pair` = `{ originalValue: string; modifiedValue: string }`，`LayoutMode` = `side-by-side | inline`，`ViewMode` = `edit | preview`，`EditMode` = `original | modified | diff`，`Source` = `original | modified`，`Theme` = `vs-dark | vs-light`。枚举值均为字符串。

## VmoMonacoEditor

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `viewMode` | `'edit' \| 'preview'` | `'edit'` | 独立的编辑／预览状态，支持 `v-model:view-mode` |
| `modelValue` | `string` | `'//code content gose here...'` | 编辑内容，支持 `v-model` |
| `prefix` | `string` | `'(()=>{})'` | 编辑器上方展示内容，不进入 model |
| `suffix` | `string` | `'};'` | 编辑器下方展示内容，不进入 model |
| `needConfirm` | `boolean` | `false` | 延迟提交内容 |
| `bidibind` | `boolean` | `true` | 同步外部内容变更 |
| `disabled` | `boolean` | `false` | 设置 Monaco 为只读 |
| `fullScreen` | `boolean` | `false` | 全屏状态，支持 `v-model:full-screen` |
| `zIndex` | `number` | `99` | 全屏容器层级 |
| `monacoOptions` | `VmoMonacoEditorOption` | `{}` | Monaco 配置增量 |
| `remindConfig` | `{ language?: 'sql' \| 'python' \| 'groovy'; extra: Partial<VmoMonacoContext> }[]` | `[]` | 自定义补全配置 |

状态 props 初始化内部状态，外部实际变化时同步；内部操作立即生效并 emit `update:*`，无需父组件回写。配置对象按外部字段变化同步，等价重渲染保留内部设置。

默认 Monaco 配置为 `automaticLayout: true`、`theme: 'vs-dark'`、`language: 'typescript'`、`lineNumbers: 'on'`、`fontSize: 12`、`minimap: { enabled: true }`。传入配置与默认配置深度合并。

### Emits

| `事件` | 参数 | 触发时机 |
| --- | --- | --- |
| `update:viewMode` / `view-mode-change` | ViewMode | 编辑／预览状态实际变化 |
| `update:modelValue` | `string` | 实时编辑或 `commit()` |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | 控件或 API 实际改变内部配置，返回独立的配置快照 |
| `update:fullScreen` / `fullscreen-change` | `boolean` | 全屏状态实际变化 |
| `change` | `string` | 默认失焦，或 `commit()` |
| `focuse` | 无 | 编辑器获得焦点，名称确实拼写为 `focuse` |
| `blur` | 无 | 编辑器失去焦点 |

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `currentViewMode` | ViewMode | 当前编辑／预览状态 |
| `computedMonacoEditorOption` | Option | 默认配置与内部配置合并后的当前配置 |
| `currentReadOnly` | boolean | 当前只读状态，跟随 disabled 和 monacoOptions.readOnly |
| `isFullScreen` | boolean | 当前全屏状态，由 `fullScreen` 初始化 |
| `hasPreview` | boolean | 是否存在 preview 插槽 |
| `currentPreviewSource` | 'original' | 普通编辑器固定预览唯一正文草稿 |
| `previewContent` | string | 当前内部草稿，包括未提交编辑 |
| `previewLanguage` | string | 当前语言，回退 plaintext |
| `innerValue` | string | 内部草稿，包括未提交编辑 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `changeViewMode(mode: ViewMode)` | 只改变编辑／预览状态；preview 要求提供对应插槽 |
| `togglePreview()` | 切换编辑／预览，保留 Monaco 实例与草稿 |
| `insertCodeString(codeString: string)` | 在光标处插入，不替换选区；无光标时不执行 |
| `resetMonacoEditorOptions(options: Option)` | 深度合并配置，后续通过 watcher 更新 Monaco |
| `changeFullScreen(value: boolean)` | 设置全屏状态，实际变化时 emit 更新 |
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


### 插槽

| 名称 | 参数 | 默认内容与渲染条件 |
| --- | --- | --- |
| `default` | `{ viewMode: ViewMode }` | 位于编辑器上方，可放工具栏；未提供时不渲染此区域 |
| `prefix` | `{ option: VmoMonacoEditorOption }` | 替换上方附加内容；未提供插槽时用 `v-html` 渲染 prefix prop。插槽存在或 prefix 非空时渲染 |
| `suffix` | `{ option: VmoMonacoEditorOption }` | 替换下方附加内容；未提供插槽时用 `v-html` 渲染 suffix prop。插槽存在或 suffix 非空时渲染 |
| `preview` | `{ content: string; language: string; source: 'original'; theme: Theme }` | 当前草稿，仅在 preview 状态渲染，无内置渲染器。 |

`option` 是合并默认值后的当前配置，随状态更新。prefix／suffix 不是 Monaco model 内容；插槽不会得到草稿或提交方法。普通文本可用 Vue 插值，HTML prop 只应传入可信内容。

```vue
<VmoMonacoEditor ref="editorRef" v-model="code" style="height: 400px">
  <template #default><VmoMonacoUi :monaco="editorRef" /></template>
  <template #prefix="{ option }"><span>{{ option.language }}</span></template>
  <template #suffix="{ option }"><span>{{ option.fontSize }} px</span></template>
</VmoMonacoEditor>
```

## VmoMonacoDiffEditor

实时模式下，每侧内容变化分别发出 `update:originalValue` 或 `update:modifiedValue`；失焦发出 `change`。审阅操作在下一 tick 发出审阅事件，并在非确认模式下提交两个值及 `change`。`confirm()` / `commit()` 不等待差异计算，立即提交当前内容。diff 双栏的焦点事件绑定提案侧；单视图绑定当前显示侧。

`needConfirm` 只延迟 `update:originalValue`／`update:modifiedValue` 内容提交；显示模式、预览来源、布局、设置和全屏的 `update:*` 仍立即发出。`bidibind` 只影响外部文本值同步。`monacoOptions`／`diffOptions` 的外部 props 同步不会发出配置回写事件，内部控件／API 变化才发出配置快照。

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `viewMode` | `'edit' \| 'preview'` | `'edit'` | 独立的编辑／预览状态，支持 `v-model:view-mode` |
| `originalValue` | `string` | `''` | `v-model:original-value` |
| `modifiedValue` | `string` | `''` | `v-model:modified-value` |
| `prefix` / `suffix` | `string` | `''` | model 外的展示内容 |
| `editMode` | `'original' \| 'modified' \| 'diff'` | `'diff'` | 独立的编辑内容选择，支持 `v-model:edit-mode` |
| `previewSource` | `'original' \| 'modified'` | 未设置 | 指定预览来源 |
| `diffViewMode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | 差异布局 |
| `editableOriginal` | `boolean` | `false` | 允许编辑原文 |
| `editableModified` | `boolean` | `true` | 允许编辑提案 |
| `needConfirm` | `boolean` | `false` | 手动提交 |
| `bidibind` | `boolean` | `true` | 同步外部值 |
| `disabled` | `boolean` | `false` | 只读编辑视图 |
| `fullScreen` | `boolean` | `false` | 全屏状态，支持 `v-model:full-screen` |
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
| `update:viewMode` / `view-mode-change` | ViewMode | 编辑／预览状态实际变化 |
| `update:editMode` / `edit-mode-change` | EditMode | 内容选择实际变化，预览中也可独立改变 |
| `update:previewSource` / `preview-source-change` | `'original' \| 'modified'` | 预览来源实际变化 |
| `update:diffViewMode` / `diff-view-mode-change` | `'side-by-side' \| 'inline'` | 比对布局实际变化 |
| `update:monacoOptions` / `options-change` | `VmoMonacoEditorOption` | 控件或 API 实际改变共享配置 |
| `update:diffOptions` / `diff-options-change` | diff 选项对象 | API 实际改变差异配置 |
| `update:fullScreen` / `fullscreen-change` | `boolean` | 全屏状态实际变化 |
| `update:originalValue` | `string` | 原文更新/提交 |
| `update:modifiedValue` | `string` | 提案更新/提交 |
| `change` | `pair` | 当前两个 model 的内容 |
| `accept-change` / `reject-change` | `pair & { index?: number; lineChange?: ILineChange }` | 单个差异块接受/拒绝 |
| `accept-all` / `reject-all` | `pair` | 批量接受/拒绝 |
| `confirm` | `pair & { confirmedValue: string }` | 确认当前原文 |
| `focuse` / `blur` | 无 | 焦点变化，保留 `focuse` 拼写 |

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `currentViewMode` | ViewMode | 当前编辑／预览状态 |
| `currentEditMode` | EditMode | 当前正文／提案／比对选择 |
| `computedMonacoEditorOption` | Option | 默认配置与内部配置合并后的当前配置 |
| `isFullScreen` | boolean | 当前全屏状态，由 `fullScreen` 初始化 |
| `currentReadOnly` | boolean | 当前视图是否只读 |
| `currentDiffViewMode` | LayoutMode | 当前并排/内联布局 |
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
| `changeFullScreen(value: boolean)` | 设置全屏状态，实际变化时 emit 更新 |
| `fullscreenSwitch()` | 切换当前组件容器全屏状态 |
| `changeLanguage(language: string)` | 更新 model 语言和内部配置 |
| `refreshMonacoEditor()` | 重建 editor；模型保留规则见使用指南 |
| `commit()` | 提交内部值；普通编辑器发出 update:modelValue 和 change，diff 等同 confirm |
| `resetMonacoDiffEditorOptions(options: Partial<Monaco.editor.IStandaloneDiffEditorConstructionOptions>)` | 深度合并 diff 选项；布局和编辑权限仍由专用 props/状态控制 |
| `changeViewMode(mode: ViewMode)` | 只改变编辑／预览状态；preview 要求提供对应插槽 |
| `changeEditMode(mode: EditMode)` | 只改变内容选择，不退出预览 |
| `togglePreview()` | 进入预览或返回此前编辑模式；无插槽时不进入 |
| `changeDiffViewMode(mode: LayoutMode)` | 切换 diff 布局，不发出编辑器级布局事件 |
| `changePreviewSource(source: Source)` | 切换预览来源；实际变化时发出 update:previewSource 与 preview-source-change |
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


### 插槽

| 名称 | 参数 | 默认内容与渲染条件 |
| --- | --- | --- |
| `default` | `{ viewMode: ViewMode }` | 位于编辑器上方，可放工具栏；未提供时不渲染此区域 |
| `prefix` | `{ option: VmoMonacoEditorOption }` | 替换上方附加内容；未提供插槽时用 `v-html` 渲染 prefix prop。插槽存在或 prefix 非空时渲染 |
| `suffix` | `{ option: VmoMonacoEditorOption }` | 替换下方附加内容；未提供插槽时用 `v-html` 渲染 suffix prop。插槽存在或 suffix 非空时渲染 |
| `preview` | `{ content: string; language: string; source: Source; theme: Theme }` | 仅在 currentViewMode 为 preview 时渲染；提供此插槽才有预览能力，无内置正文渲染器 |

`option` 是合并默认值后的当前配置，随状态更新。prefix／suffix 不是 Monaco model 内容；插槽不会得到草稿或提交方法。普通文本可用 Vue 插值，HTML prop 只应传入可信内容。

`content` 是 source 选中一侧的内部草稿，包括未提交修改；`language` 是当前编辑器语言，缺省回退 plaintext；`source` 为 original／modified；`theme` 是当前编辑器主题。插槽替换预览内容区域，不替换外层预览容器或来源按钮（提案非空时显示来源按钮）。不提供插槽时不能进入预览，没有插槽时 viewMode 回退到 edit，保留 editMode，移除插槽也会退出预览。

```vue
<VmoMonacoDiffEditor :original-value="original" :modified-value="proposal" style="height: 500px">
  <template #prefix="{ option }"><span>{{ option.language }}</span></template>
  <template #preview="{ content, language, source, theme }">
    <VmoCodePreview :content="content" :language="language" :theme="theme" />
    <span>{{ source }}</span>
  </template>
  <template #suffix="{ option }"><span>{{ option.fontSize }} px</span></template>
</VmoMonacoDiffEditor>
```

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

状态通过现有控件的当前值、选中态和提示表达。default 插槽完整替换默认工具栏。`config.fullScreen` 控制按钮可见性，编辑器的 `fullScreen` prop 控制状态。

### Emits 与实例方法

没有自定义 emit。内部控件的交互事件不会由 UI 自动转发；需要监听时使用自定义默认插槽中的控件。编辑器状态变化则直接监听编辑器自身的 `update:*` 事件。

### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `monacos` | Target[] | 当前编辑器目标数组 |
| `editorOption` | Option | 首个目标的当前配置 |
| `theme` | Theme | 第一个目标的主题，回退 vs-light |
| `monacoNeedConfirm` | boolean | 是否有目标需要手动提交 |
| `languageVisible` | boolean | 语言列表多于一项且未显式隐藏 |
| `languageControlConfig` | `{ languages?: string[] } / undefined` | 解析后的语言配置 |
| `fontSizeControlConfig` | `{ min?: number; max?: number; step?: number } / undefined` | 解析后的字号配置 |
| `themeControlConfig` | Theme / undefined | 解析后的主题配置 |
| `lineNumbersControlConfig` | on / off / undefined | 解析后的行号配置 |
| `reviewActionsControlConfig` | boolean | 是否启用审阅控件 |



### 插槽

编辑器承载工具栏的 default 插槽与 `VmoMonacoUi` 的 default 插槽都接收 `{ viewMode }`，值为内部实际生效的 edit／preview 状态，不依赖父组件回写。UI 使用首个目标；没有目标时回退 edit。

| 名称 | 参数 | 默认内容与渲染条件 |
| --- | --- | --- |
| `default` | `{ viewMode: ViewMode }` | 完整替换默认标题与控件；保留 provide 的编辑器上下文 |
| `review-actions` | 下表全部参数 | 替换默认审阅控件弹出菜单的内容；需要默认工具栏、config.reviewActions 为真，并打开审阅菜单 |

自定义 default 后，原默认审阅控件不再创建，因此此处的 review-actions 不会自动转发给手动放入的 VmoMonacoDiffReview；应使用那个控件自己的 default 插槽。默认回退内容是各控件组成的工具栏和内置审阅按钮。review-actions 不替换审阅触发图标或弹出层容器。

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

## 独立控件的公共约定

### 公共 Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `monaco` | Target | null | 显式目标优先；null 回退工具栏注入 |
| `value` | 各控件值类型 | undefined | 外部初始值及更新值，支持 v-model:value；设置类控件同步到目标编辑器，提交／审阅控件仅作为事件附加值 |
| `config` | 各控件配置类型 | undefined | 专用配置，见每个控件 |

以下各控件均包含这三个 props。`commit` 通知的公共参数为 `{ type: string; value?: TValue; config?: TConfig; monacoCount: number }`。除提交按钮外，此事件不调用编辑器提交。

设置类控件将 value（字号／语言还支持 modelValue）作为初始值，内部操作立即修改本地状态并发出 update:value；父组件不回写也会继续显示内部值。外部有效值真正变化时同步到控件及目标，目标 API 的变化也会反映到控件。外部同步不发出控件的 toggle／change／commit 交互事件；它调用编辑器 API 时可能产生编辑器自身的配置／模式事件。移除外部值（undefined）时回到当前目标值或默认值。提交与审阅控件的 value 仅是事件附加数据。

## VmoMonacoCommitButton

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | unknown | undefined | 外部初始值及更新值 |
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



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

## VmoMonacoFontSizeInput

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | number | undefined | 外部初始值及更新值 |
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
| `currentValue` | number | 当前内部字号；按 value、modelValue、首个目标 fontSize、12 初始化。外部值实际变化及编辑器 API 更新会同步；显式 0 不按缺省值处理 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `handleInput(event: Event)` | 从 event.target.value 转为 Number，更新所有目标字号，再发出两个 update 及 commit；min/max 是输入属性，方法不额外钳制数值 |



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

## VmoMonacoLanguageSelect

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | string | undefined | 外部初始值及更新值 |
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
| `currentValue` | string | 当前内部语言；按 value、modelValue、首个目标 language、空字符串初始化。外部值实际变化及编辑器 API 更新会同步 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `handleChange(event: Event)` | 读取 event.target.value，调用所有目标 changeLanguage，再发出两个 update、change 和 commit |



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

## VmoMonacoThemeToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | Theme | undefined | 外部初始值及更新值 |
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
| `currentTheme` | Theme | 当前内部主题；初始值按 value → theme → config → 首个目标主题 → vs-light 解析 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleTheme()` | 切换 vs-dark/vs-light，更新所有目标并发出 update:value、toggle、commit |



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

## VmoMonacoFullscreenToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | boolean | undefined | 外部初始值及更新值 |
| `config` | boolean | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |
| `isFullScreen` | boolean | undefined | 兼容初始值及更新值，false 明确退出全屏 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | boolean | 切换操作后 |
| `toggle` | boolean | 与 update:value 同值 |
| `commit` | 公共通知，type=fullScreen | 值事件之后 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `currentValue` | boolean | 当前内部状态；初始化按 value → config → isFullScreen → 首个目标状态解析 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleFullScreen()` | 仅切换第一个目标；无目标不执行也不发事件；发出 update:value、toggle、commit |



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

## VmoMonacoLineNumbersToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | on / off | undefined | 外部初始值及更新值 |
| `config` | on / off | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | on / off | 切换操作后 |
| `toggle` | on / off | 与 update:value 同值 |
| `commit` | 公共通知，type=lineNumbers | 值事件之后 |


### 实例属性

`currentValue` 返回当前内部状态，初始化后跟随外部值变化及编辑器 API 更新。

### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleLineNumbers()` | 切换内部状态，更新所有目标并发出 update:value、toggle、commit；currentValue 可读取 |



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

## VmoMonacoMinimapToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | boolean | undefined | 外部初始值及更新值 |
| `config` | boolean | undefined | 控件配置 |
| `monaco` | Target | null | 公共目标 |


### Emits

| `事件` | 参数 | 时机 |
| --- | --- | --- |
| `update:value` | boolean | 切换操作后 |
| `toggle` | boolean | 与 update:value 同值 |
| `commit` | 公共通知，type=minimap | 值事件之后 |


### 实例属性

`currentValue` 返回当前内部状态，初始化后跟随外部值变化及编辑器 API 更新。

### 实例方法

| `签名` | 说明 |
| --- | --- |
| `toggleMinimap()` | 切换内部状态，更新所有目标并发出 update:value、toggle、commit；currentValue 可读取 |



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

## VmoMonacoPreviewToggle

### Props

| `属性` | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | boolean | undefined | 外部初始值及更新值 |
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
| `previewMonacos` | VmoMonacoEditorExpose[] | 过滤出有预览插槽和预览方法的目标 |
| `currentValue` | boolean | 当前内部预览状态；由 value 初始化，跟随外部更新和目标状态变化 |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `togglePreview()` | 统一进入/退出所有有效目标；无有效目标不执行也不发事件；config 只随通知传出，不决定显示或状态 |



### 插槽

| 名称 | 参数 | 默认内容与渲染条件 |
| --- | --- | --- |
| `default` | `{ active: boolean }` | 定制按钮内的内容；仅在有可预览目标时渲染。缺省仅显示图标，通过提示与选中态表达状态 |

active 表示当前内部预览状态，不是下一步操作。插槽保留外层 button、图标、点击行为、title、aria-label 和 aria-pressed；不替换整个按钮，不要在其中嵌套另一个按钮。

```vue
<VmoMonacoPreviewToggle :monaco="diffRef">
  <template #default="{ active }">
    <span>{{ active ? 'Return to editor' : 'Preview' }}</span>
  </template>
</VmoMonacoPreviewToggle>
```

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
  mode?: VmoMonacoDiffEditMode | VmoMonacoDiffViewMode
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
| `edit-mode-change` | ReviewControlPayload；mode 为 original／modified／diff；不改变 viewMode |
| `diff-view-mode-change` | ReviewControlPayload；mode 为 diff 布局 |


### 实例属性

| `属性` | 类型 | 说明 |
| --- | --- | --- |
| `ReviewActionsRef` | HTMLElement / null | 菜单根 DOM，内部点击外部关闭逻辑使用 |
| `isOpen` | boolean | 菜单是否展开，初始 false |
| `lineChanges` | Monaco.editor.ILineChange[] | 首个 diff 目标的差异块，回退 [] |
| `diffPending` | boolean | 首个目标计算状态，回退 false |
| `canReview` | boolean | 非计算中且有差异；默认批量按钮使用 |
| `currentEditMode` | EditMode | 首个目标模式，回退 diff |
| `currentViewMode` | `ViewMode` | 当前编辑／预览状态，独立于 editMode |
| `hasPreview` | boolean | 首个目标是否有预览插槽，回退 false |
| `currentDiffViewMode` | LayoutMode | 首个目标布局，回退 side-by-side |


### 实例方法

| `签名` | 说明 |
| --- | --- |
| `togglePanel()` | 切换弹层及 document 点击监听，不发事件 |
| `acceptChange(index: number)` | 对所有有效目标调用单块接受，之后发出控件通知 |
| `rejectChange(index: number)` | 对所有有效目标调用单块拒绝，之后发出控件通知 |
| `acceptAllChanges()` | 对所有有效目标调用全部接受 |
| `rejectAllChanges()` | 对所有有效目标调用全部拒绝 |
| `confirm()` | 对所有有效目标确认 |
| `changeEditMode(mode: EditMode)` | 同步 editMode，不改变 viewMode 或 previewSource |
| `changeDiffViewMode(mode: LayoutMode)` | 同步 diff 布局 |

这些方法本身不检查 `canReview`；自定义菜单应自行禁用不适用的操作。`closePanel` 和目标列表没有返回到组件实例。默认插槽提供 `lineChanges`、`diffPending`、`currentEditMode`、`currentViewMode`、`hasPreview` 以及上述审阅/模式方法（不含 togglePanel）；UI 的 `review-actions` 插槽转发同一组参数。


### 插槽

| 名称 | 参数 | 默认内容与渲染条件 |
| --- | --- | --- |
| `default` | 下表全部参数 | 替换审阅弹出菜单内容；只有菜单打开时渲染。保留触发图标、弹出层、外部点击关闭逻辑；缺省为内置模式／布局／计数／接受／拒绝按钮 |

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


### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

预览内容使用 content prop；Markdown 自定义渲染使用 render prop；代码配置使用 monacoOptions。

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



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

预览内容使用 content prop；Markdown 自定义渲染使用 render prop；代码配置使用 monacoOptions。

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



### 插槽

不提供插槽。传入 default 或具名插槽不会渲染；使用该组件的 props、事件及 API 定制行为。

预览内容使用 content prop；Markdown 自定义渲染使用 render prop；代码配置使用 monacoOptions。

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


## 配置与全屏状态的共同约定

普通编辑器与差异编辑器使用相同的配置和全屏状态管理逻辑，公开 props、事件、方法及插槽保持一致的既有契约：

- `resetMonacoEditorOptions()` 深度合并内部配置；差异编辑器的 `resetMonacoDiffEditorOptions()` 对 diff 配置采用同样规则。实际结果不变时不重复发出配置事件。
- 配置 props 按外部顶层字段的实际变化同步；嵌套对象作为完整字段比较。等价对象不会覆盖内部选择，删除外部字段会移除对应内部覆盖值。外部配置同步不发出配置回写事件。
- 内部配置变化先更新状态，再依次发出 `update:monacoOptions` 和 `options-change`（diff 配置对应 `update:diffOptions` 和 `diff-options-change`）。每个事件得到独立快照；监听器修改一个事件参数不会改变内部配置或另一个事件参数。快照是内部配置覆盖值，合并默认值后的实际配置从实例的 `computedMonacoEditorOption` 读取。
- `changeFullScreen(value)` 与 `fullscreenSwitch()` 先更新内部状态，再发出 `update:fullScreen` 与 `fullscreen-change`。真实外部 fullScreen 变化也通过同一入口同步；相同值和 v-model 回写不会重复发出事件。

父组件不回写时仍保留内部操作结果。`needConfirm` 与 `bidibind` 只影响文本提交／同步，不改变上述规则。


### 维护实现

内部模块 `use.lib/use-editor-state.ts` 提供 `useEditorOptions` 与 `useEditorFullscreen`，两个编辑器复用这些组合函数。配置字段同步由 `use.lib/sync-monaco-options.ts` 负责；控件调用编辑器公开方法，组件 watcher 再把配置应用到 Monaco。模式切换、文本模型和 Monaco 资源生命周期仍由各编辑器管理。

这些组合函数不从包入口导出，不是新的公共 API。`VmoMonacoDiffEditorExpose` 继承 `VmoMonacoEditorExpose` 的共同状态和方法，仅补充差异编辑器能力。重构不改变已有绑定方式。


## 合并模式接口迁移

`displayMode`、`currentDisplayMode`、`changeDisplayMode()`、`update:displayMode`、`mode-change` 和 `VmoMonacoDiffDisplayMode` 已移除。编辑／预览绑定 `viewMode`，正文／提案／比对绑定 `editMode`；对应方法为 `changeViewMode()` 和 `changeEditMode()`。退出预览需要 `changeViewMode('edit')`；仅改变 editMode 会保留预览。

审阅控件改为发出 `edit-mode-change`。其插槽（包括 UI review-actions）提供 `currentEditMode`、`currentViewMode` 与 `changeEditMode`，不再暴露合并状态。两种模式均支持仅通知不回写，也支持 v-model 同步。
