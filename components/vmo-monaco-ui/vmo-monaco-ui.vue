<template>
  <!--
    UI 容器只负责工具栏布局、默认控件组合，以及向内部控件 provide monaco 上下文。
    控件通过 inject 消费 editor public API，自行完成对应行为。
  -->
  <div :class="['vmo-monaco-ui', theme == 'vs-dark' ? 'dark' : 'light']">
    <div class="bar">
      <slot>
        <span class="title">{{ title }}</span>
        <span class="setting">
          <!-- 默认控件不再由 UI 容器承接事件；它们通过 inject 到的 monaco 自行调用 editor public API。 -->
          <language-select v-if="languageVisible" :config="languageControlConfig" />
          <font-size-input v-if="!!config?.fontSize" :config="fontSizeControlConfig" />
          <diff-review v-if="!!config?.reviewActions" :config="reviewActionsControlConfig">
            <template v-if="$slots['review-actions']" #default="slotProps">
              <slot name="review-actions" v-bind="slotProps"></slot>
            </template>
          </diff-review>
          <theme-toggle v-if="!!config?.theme" :config="themeControlConfig" />
          <fullscreen-toggle v-if="!!config?.fullScreen" />
          <minimap-toggle v-if="!!config?.minimap" />
          <line-numbers-toggle v-if="!!config?.lineNumbers" :config="lineNumbersControlConfig" />
          
          <commit-button v-if="monacoNeedConfirm || !!config?.commit" />
        </span>
      </slot>
    </div>
    <div v-if="monacos.length" class="editor-state">
      <div class="state-group">
        <span class="state-label">内容</span>
        <div v-if="diffMonacos.length" class="content-modes" role="group" aria-label="内容视图">
          <button v-for="mode in contentModes" :key="mode.value" type="button"
            :aria-pressed="currentContentMode === mode.value"
            :title="mode.label"
            @click="changeContentMode(mode.value)">{{ mode.label }}</button>
        </div>
        <span v-else>正文</span>
        <span v-if="!isPreview && currentContentMode === 'diff'" class="state-detail">{{ diffViewLabel }}</span>
      </div>
      <div class="state-group">
        <span class="state-label">模式</span>
        <span class="state-value">{{ interactionLabel }}</span>
        <preview-toggle v-if="config.preview !== false" />
      </div>
      <span v-if="isPreview && diffMonacos.length" class="state-detail">预览来源：{{ diffMonacos[0].currentPreviewSource === 'original' ? '正文' : '提案' }}</span>
      <div class="state-group state-settings" role="status" aria-label="当前编辑器设置">
        <span>语言 <strong>{{ editorOption.language || 'plaintext' }}</strong></span>
        <span>字号 <strong>{{ editorOption.fontSize || 12 }} px</strong></span>
        <span>主题 <strong>{{ theme === 'vs-dark' ? '深色' : '浅色' }}</strong></span>
        <span v-if="monacoNeedConfirm" class="state-pending">待确认</span>
      </div>
    </div>
  </div>
</template>

<style lang="css">
/* @import url('./assets/iconfont/iconfont.css'); */
.vmo-monaco-ui {
  @apply flex flex-col px-[15px] border-b border-[#88888830] shrink-0;
}
.vmo-monaco-ui.dark {
  @apply bg-[#1C1C1C] text-[#FFFFFF88];
}
.vmo-monaco-ui.light {
  @apply bg-[#FFFFFF] text-gray-800;
}
.vmo-monaco-ui .bar {
  @apply flex flex-row w-full min-h-[40px] gap-[12px] flex-wrap items-center justify-between;
}
.vmo-monaco-ui .title {
  @apply text-xs font-bold flex-grow;
}
.vmo-monaco-ui .setting {
  @apply text-xs flex flex-row flex-wrap gap-y-[8px] items-center justify-between;
}
.vmo-monaco-ui .iconButton {
  @apply !w-[20px] !h-[20px] shrink-0 rounded flex flex-row items-center justify-center cursor-pointer mr-[10px] last:mr-0;
}
.vmo-monaco-ui .fontsize {
  @apply h-[20px] flex-row flex items-center mr-[10px] last:mr-0;
}
.vmo-monaco-ui .fontsize .number {
  @apply outline-none !bg-[#88888810] mx-[5px] w-[50px] p-[4px] rounded flex-grow border border-[#88888833] !text-center;
}
.vmo-monaco-ui .iconButton.runningStyle {
  @apply text-[#00BB55];
}
.vmo-monaco-ui .languages {
  @apply w-[100px] flex-row flex mr-[10px] last:mr-0 items-center uppercase;
}
.vmo-monaco-ui .languages select {
  @apply flex-grow w-0 outline-none bg-[#88888820] border-none ml-[5px] p-[4px] border border-[#88888833] rounded;
}
.vmo-monaco-ui .editor-state {
  @apply flex flex-row flex-wrap items-center gap-x-[20px] gap-y-[8px] w-full py-[8px] border-t border-[#88888820] text-xs;
}
.vmo-monaco-ui .state-group {
  @apply flex flex-row flex-wrap items-center gap-[8px];
}
.vmo-monaco-ui .state-label, .vmo-monaco-ui .state-detail {
  @apply opacity-70;
}
.vmo-monaco-ui .state-value { @apply font-medium; }
.vmo-monaco-ui .state-settings { @apply ml-auto gap-x-[16px]; }
.vmo-monaco-ui .state-settings strong { @apply font-medium; }
.vmo-monaco-ui .state-pending { @apply text-amber-600; }
.vmo-monaco-ui .content-modes { @apply flex rounded border border-[#88888833] overflow-hidden; }
.vmo-monaco-ui .content-modes button { @apply px-[10px] py-[3px] cursor-pointer; }
.vmo-monaco-ui .content-modes button[aria-pressed='true'] { @apply text-[#00BB55] bg-[#00BB5514] font-bold; }
.vmo-monaco-ui button:focus-visible { @apply outline outline-2 outline-offset-2 outline-[#00BB55]; }
</style>

<script lang="ts">
import { computed, defineComponent, provide } from 'vue'
import type { PropType } from 'vue'
import type { VmoMonacoDiffEditorExpose } from '@type'
import LanguageSelect from './controls/language-select.vue'
import FontSizeInput from './controls/font-size-input.vue'
import ThemeToggle from './controls/theme-toggle.vue'
import FullscreenToggle from './controls/fullscreen-toggle.vue'
import MinimapToggle from './controls/minimap-toggle.vue'
import LineNumbersToggle from './controls/line-numbers-toggle.vue'
import CommitButton from './controls/commit-button.vue'
import DiffReview from './controls/diff-review.vue'
import PreviewToggle from './controls/preview-toggle.vue'
import type { VmoMonacoLanguageControlConfig } from './controls/language-select.vue'
import type { VmoMonacoFontSizeControlConfig } from './controls/font-size-input.vue'
import type { VmoMonacoThemeControlConfig } from './controls/theme-toggle.vue'
import type { VmoMonacoMinimapControlConfig } from './controls/minimap-toggle.vue'
import type { VmoMonacoLineNumbersControlConfig } from './controls/line-numbers-toggle.vue'
import type { VmoMonacoFullScreenControlConfig } from './controls/fullscreen-toggle.vue'
import type { VmoMonacoCommitControlConfig } from './controls/commit-button.vue'
import type { VmoMonacoDiffReviewControlConfig } from './controls/diff-review.vue'
import { VMO_MONACO_EDITOR_KEY } from './controls/use-monaco-control'
import type { VmoMonacoControlTarget } from './controls/use-monaco-control'

// UI 层的 config 是各个 control 局部 config 的组合：
// - boolean 用于控制是否显示该控件
// - 对象/枚举值用于把对应控件的专属配置传下去
// 具体控件的 config 类型仍由控件自身维护，UI 层只做组合。
export type MonacoUIConfig = {
  fontSize: boolean | VmoMonacoFontSizeControlConfig
  theme: boolean | VmoMonacoThemeControlConfig
  minimap: boolean | VmoMonacoMinimapControlConfig
  lineNumbers: boolean | VmoMonacoLineNumbersControlConfig
  fullScreen: boolean | VmoMonacoFullScreenControlConfig
  commit: boolean | VmoMonacoCommitControlConfig
  preview: boolean
  reviewActions: boolean | VmoMonacoDiffReviewControlConfig
  language: boolean | VmoMonacoLanguageControlConfig
  languages: string[]
}

export default defineComponent({
  name: 'vmo-monaco-ui',
  inheritAttrs: false,
  components: {
    LanguageSelect,
    FontSizeInput,
    ThemeToggle,
    FullscreenToggle,
    MinimapToggle,
    LineNumbersToggle,
    CommitButton,
    DiffReview,
    PreviewToggle
  },
  props: {
    title: {
      type: String as PropType<string>,
      default: 'VMO:Editor'
    },
    monaco: {
      // 组件实例 ref 暴露出的 public API。UI 容器通过 provide 交给内部 controls 使用。
      type: [Object, Array] as PropType<VmoMonacoControlTarget>,
      default: null
    },
    config: {
      type: Object as PropType<Partial<MonacoUIConfig>>,
      default: () => ({
        fontSize: true,
        theme: true,
        minimap: true,
        lineNumbers: true,
        fullScreen: true,
        languages: ['css', 'html', 'json', 'javascript', 'typescript']
      })
    }
  },
  setup(props, context) {
    // 隐式注入入口：放在 vmo-monaco-ui 内部的 control 不需要重复传 monaco。
    // 如果 control 自己显式传了 monaco prop，则由 useVmoMonacoControl 内部优先使用显式 prop。
    const providedMonaco = computed(() => props.monaco)
    provide(VMO_MONACO_EDITOR_KEY, providedMonaco)

    // UI 当前显示状态以 monaco.computedMonacoEditorOption 为准，确保外部 monacoOptions 和控件操作都能反映到工具栏。
    const monacos = computed(() => {
      const target = props.monaco
      return Array.isArray(target) ? target : target ? [target] : []
    })
    const editorOption = computed(() => monacos.value[0]?.computedMonacoEditorOption || {})
    const theme = computed(() => editorOption.value.theme || 'vs-light')
    const diffMonacos = computed(() => monacos.value.filter((target): target is VmoMonacoDiffEditorExpose =>
      typeof (target as Partial<VmoMonacoDiffEditorExpose>)?.changeEditMode === 'function'))
    const primaryDiff = computed(() => diffMonacos.value[0])
    const isPreview = computed(() => monacos.value[0]?.currentViewMode === 'preview')
    const currentContentMode = computed(() => primaryDiff.value?.currentEditMode || 'original')
    const diffViewLabel = computed(() => primaryDiff.value?.currentDiffViewMode === 'inline' ? '行内' : '并排')
    const interactionLabel = computed(() => isPreview.value ? '预览'
      : (monacos.value[0]?.currentReadOnly ?? editorOption.value.readOnly) ? '只读' : '编辑')
    const contentModes = [
      { value: 'original', label: '正文' },
      { value: 'modified', label: '提案' },
      { value: 'diff', label: '比对' }
    ] as const
    function changeContentMode(mode: 'original' | 'modified' | 'diff') {
      diffMonacos.value.forEach(editor => editor.changeEditMode(mode))
    }
    const monacoNeedConfirm = computed(() => monacos.value.some(monaco => monaco?.needConfirm))

    // UI config 的 true/false 主要表示是否显示控件。
    // 只有对象或枚举值才会作为 control 的专属 config 传入，避免 boolean show flag 被误当成当前值。
    const languageControlConfig = computed(() => {
      if (!!props.config?.language && typeof props.config.language == 'object') {
        return props.config.language
      }
      return props.config?.languages ? { languages: props.config.languages } : undefined
    })
    const languageVisible = computed(() => {
      if (props.config.language === false) return false
      const languages = languageControlConfig.value?.languages || []
      return languages.length > 1
    })
    const fontSizeControlConfig = computed(() => {
      return !!props.config?.fontSize && typeof props.config.fontSize == 'object' ? props.config.fontSize : undefined
    })
    const themeControlConfig = computed(() => {
      return typeof props.config?.theme == 'string' ? props.config.theme : undefined
    })
    const lineNumbersControlConfig = computed(() => {
      return typeof props.config?.lineNumbers == 'string' ? props.config.lineNumbers : undefined
    })
    const reviewActionsControlConfig = computed(() => {
      return !!props.config?.reviewActions
    })

    return {
      monacos, editorOption, diffMonacos, contentModes, currentContentMode, isPreview,
      diffViewLabel, interactionLabel, changeContentMode,
      theme,
      monacoNeedConfirm,
      languageVisible,
      languageControlConfig,
      fontSizeControlConfig,
      themeControlConfig,
      lineNumbersControlConfig,
      reviewActionsControlConfig
    }
  }
})
</script>
