import { ref, watch, type Ref } from 'vue'
import { clone, equals, mergeDeepRight } from 'ramda'
import { syncMonacoOptions } from './sync-monaco-options'

type StateEmitter<Event extends string> = (event: Event, value: unknown) => void

/** External changes synchronize; local choices survive equivalent parent rerenders. */
export function useEditorOptions<
  T extends object,
  Prop extends 'monacoOptions' | 'diffOptions',
  Notification extends 'options-change' | 'diff-options-change'
>(
  external: () => T | null | undefined,
  emit: StateEmitter<`update:${Prop}` | Notification>,
  prop: Prop,
  notification: Notification
) {
  const options = ref({}) as Ref<T>
  let previous: T | undefined
  watch(external, incoming => {
    if (!incoming) return
    options.value = syncMonacoOptions(options.value, incoming, previous)
    previous = clone(incoming)
  }, { immediate: true, deep: true })

  function reset(patch: Partial<T>) {
    const next = mergeDeepRight(options.value, patch) as unknown as T
    if (equals(next, options.value)) return
    options.value = next
    // Each event owns its snapshot so a listener cannot mutate the other payload.
    emit(`update:${prop}`, clone(next))
    emit(notification, clone(next))
  }
  return { options, reset }
}

/** Both editors expose the same full-screen state and commands. */
export function useEditorFullscreen(external: () => boolean, emit: StateEmitter<'update:fullScreen' | 'fullscreen-change'>) {
  const isFullScreen = ref(external())
  function changeFullScreen(value: boolean) {
    if (value === isFullScreen.value) return
    isFullScreen.value = value
    emit('update:fullScreen', value)
    emit('fullscreen-change', value)
  }
  watch(external, changeFullScreen)
  function fullscreenSwitch() {
    changeFullScreen(!isFullScreen.value)
  }
  return { isFullScreen, changeFullScreen, fullscreenSwitch }
}
