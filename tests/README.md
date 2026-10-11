# 测试与覆盖率

```sh
npm test
npm run coverage
npm run test:coverage:check
npm run build
```

`npm test` 执行行为回归测试。`coverage` 运行相同测试并生成
`coverage/index.html`、`coverage/coverage-final.json` 和
`coverage/coverage-summary.json`。`test:coverage:check` 要求语句、分支、函数、行
四项覆盖率全部达到 100%，否则返回非零退出码；测试失败也会使命令失败。

覆盖率使用 Istanbul 在 TypeScript 转译前插桩，Vue 脚本保留其在原始文件中的行号。
VM 执行上下文共享计数器，每个测试进程独立保存结果，报告合并各进程计数。
所有 `components`、`use.lib` 中的 TypeScript/Vue 脚本，以及公开入口 `index.ts`
均纳入统计，未执行的模块按零覆盖率计入。纯类型声明没有可执行计数器，不影响总数。
测试转译目标为 ES2020，与项目 TypeScript 配置一致。

## 范围与限制

这个报告衡量组件脚本和工具函数，**不代表整个项目的覆盖率**。Vue 模板、CSS、
演示应用、构建配置和第三方 Monaco 内部代码不在该数值的统计范围内。
部分模板通过 Vue 编译器、服务端渲染或自定义渲染器验证；这些检查不会被计入脚本覆盖率。

Monaco 和浏览器生命周期边界在单元测试中使用替身。测试检查模型内容、事件、
资源释放、配置同步和公开 API 行为，但不能代替真实浏览器中的 Monaco 集成测试。
补全提供器、入口和通用控件测试使用真实库脚本之间的依赖关系。

已覆盖的主要行为：

- 局部接受/拒绝，包括首尾插入、删除、空文档、Unicode、LF/CRLF 和撤销。
- 原生审阅动作识别、行号映射、字符级差异及差异未就绪时的操作保护。
- 全量接受/拒绝、确认提交、外部内容同步和 `needConfirm`/`bidibind` 行为。
- 预览源切换、模式恢复、插槽移除、三种渲染器及代码预览的只读约束。
- 语言、主题、字体大小、行号、缩略图、全屏、批量目标和工具栏配置。
- 补全提供器的额外提示合并、模型隔离和替换范围。
- 编辑器刷新、模型所有权、补全提供器释放、失败清理和 URI 冲突。

2026-10-11 的验证结果：128 项测试通过，类型检查和构建通过。
组件 TypeScript/Vue 脚本与工具函数的语句、分支、函数、行覆盖率均为 **100%**，
`npm run test:coverage:check` 严格检查通过。没有新增忽略注释或缩小覆盖范围。

状态绑定回归覆盖 props 初始化、父组件不回写时的内部变化、外部实际变化、
等价配置重渲染、v-model 回写后的重复事件保护、独立控件别名、直接编辑器 API 更新、
预览来源保留、全屏同步和事件配置快照隔离。清理了数组 watcher 的恒真判断，以及
只会在模型已验证后调用的私有比较创建函数中的重复模型判断。

真实浏览器中另行挂载真实 Vue/Monaco 组件，14 项断言通过：检查 readonly、工具栏
内容与预览切换、不回写时的内部状态、等价配置保留、真实外部字段变化、所有新增
状态的回写、Monaco 语言和字号、后续外部更新及配置事件无循环。普通编辑器另有 3 项浏览器断言，
检查 disabled 与 monacoOptions.readOnly 的外部变化能同步到只读／编辑状态展示。

真实浏览器检查使用 `npm run dev` 后的 `/preview.html`：输入 Markdown 和原始
`<script>` 文本，进入预览，依次选择 Markdown、Text、Code，检查转义、原文、
Monaco 的只读属性，再退出预览确认恢复编辑模式。此次检查通过。
完整端到端自动化、跨浏览器检查和性能/大文件压力测试仍不属于这次已完成的验证。

独立状态回归逐项验证 viewMode、editMode、previewSource、diffViewMode 与 fullScreen：
初始化、立即内部更新、无回写保留、真实 props 变化、v-model 回写及重复事件保护。
审阅与工具栏只改变对应维度，预览中切换 editMode／布局保持 viewMode 与 previewSource。
