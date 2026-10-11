import { clone, equals } from 'ramda'

/** Apply actual external changes without overwriting toolbar choices on parent rerenders. */
export function syncMonacoOptions<T extends object>(current: T, next: T, previous: T | undefined): T {
  if (!previous) return clone(next)
  const result = { ...current } as Record<string, unknown>
  const incoming = next as Record<string, unknown>
  const before = previous as Record<string, unknown>
  for (const key of Object.keys(before)) {
    if (!Object.prototype.hasOwnProperty.call(incoming, key)) delete result[key]
  }
  for (const key of Object.keys(incoming)) {
    if (!Object.prototype.hasOwnProperty.call(before, key) || !equals(incoming[key], before[key])) result[key] = clone(incoming[key])
  }
  return result as T
}
