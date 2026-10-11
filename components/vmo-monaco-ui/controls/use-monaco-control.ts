import { computed, inject, ref, unref, watch } from 'vue'
import type { ComputedRef, InjectionKey, PropType, Ref } from 'vue'
import type { VmoMonacoEditorExpose } from '@type'

// 单个 control 可以控制一个 editor，也可以同时控制一组 editor。
// 数组模式用于“一个按钮同步控制多个 Monaco 实例”的场景。
export type VmoMonacoControlTarget = VmoMonacoEditorExpose | VmoMonacoEditorExpose[] | null
export type VmoMonacoControlTargetRef = Ref<VmoMonacoControlTarget> | ComputedRef<VmoMonacoControlTarget>

// 所有 control 的统一外部行为事件。
// value/config 的具体类型由各控件自己声明，公共层只约束事件结构。
export type VmoMonacoControlCommitPayload<TValue = unknown, TConfig = unknown> = {
  type: string
  value?: TValue
  config?: TConfig
  monacoCount: number
}

// vmo-monaco-ui 后续会通过这个 key provide editor 实例。
// slot 内的小控件可以不传 monaco prop，自动 inject 当前工具栏绑定的 editor。
export const VMO_MONACO_EDITOR_KEY: InjectionKey<VmoMonacoControlTargetRef> = Symbol('VMO_MONACO_EDITOR_KEY')

/**
 * 创建 control 通用 props。
 *
 * TValue: 当前控件值类型，例如 theme 是 'vs-dark' | 'vs-light'，fontSize 是 number。
 * TConfig: 当前控件自己的配置类型，例如 fontSize 的 min/max/step。
 *
 * 三个通用 props 的约定：
 * - value: 初始化内部值；外部实际改变时同步，内部操作无需等待父组件回写。
 * - config: 控件专属配置，不在公共层定义具体结构。
 * - monaco: 显式注入 editor 实例；如果不传，则尝试从 vmo-monaco-ui inject。
 */
export function createVmoMonacoControlProps<TValue = unknown, TConfig = unknown>() {
  return {
    value: {
      type: null as unknown as PropType<TValue>,
      default: undefined
    },
    config: {
      type: [Object, String, Number, Boolean, Array] as PropType<TConfig>,
      default: undefined
    },
    monaco: {
      type: [Object, Array] as PropType<VmoMonacoControlTarget>,
      default: null
    }
  }
}

/**
 * 解析 control 当前可用的 Monaco 上下文。
 *
 * 注入优先级：
 * 1. props.monaco 显式传入，适合控件脱离 vmo-monaco-ui 单独使用，或在 slot 内临时控制其他 editor。
 * 2. VMO_MONACO_EDITOR_KEY 隐式注入，适合控件放在 vmo-monaco-ui slot 内自动绑定当前 editor。
 *
 * 返回值：
 * - currentMonaco: 原始目标，可能是单实例、数组或 null。
 * - monacos: 归一化后的数组，控件执行行为时统一遍历它。
 * - editorOption: 第一个 editor 的配置，用作控件默认显示状态。
 * - eachMonaco: 控件调用 editor public API 的统一遍历入口。
 */
export function useVmoMonacoControl(props: { monaco?: VmoMonacoControlTarget }) {
  const injectedMonaco = inject(VMO_MONACO_EDITOR_KEY, ref(null))
  const currentMonaco = computed(() => props.monaco || unref(injectedMonaco))
  const monacos = computed(() => {
    const target = currentMonaco.value
    return (Array.isArray(target) ? target : target ? [target] : []).filter(Boolean)
  })
  // 多 editor 场景下，控件显示值以第一个 editor 为准；操作行为会应用到全部 editor。
  const editorOption = computed(() => monacos.value[0]?.computedMonacoEditorOption || {})

  function eachMonaco(callback: (monaco: VmoMonacoEditorExpose) => void) {
    monacos.value.forEach(callback)
  }

  return {
    currentMonaco,
    monacos,
    editorOption,
    eachMonaco
  }
}

/** Keep local changes until an external value actually changes; also follow editor API changes. */
export function useVmoMonacoControlValue<T>(external: () => T | undefined, fallback: () => T, apply: (value: T) => void) {
  const current = ref<T>(external() ?? fallback()) as Ref<T>
  watch(fallback, value => { current.value = value }, { flush: 'sync' })
  watch(external, value => {
    current.value = value ?? fallback()
    if (value !== undefined) apply(value)
  }, { immediate: true, flush: 'sync' })
  return current
}
