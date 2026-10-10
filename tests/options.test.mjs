import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLibraryLoader } from './helpers/load-library.mjs'

test('option sync removes deleted external keys and preserves internally changed unchanged keys', () => {
  const { syncMonacoOptions } = createLibraryLoader()('use.lib/sync-monaco-options.ts')
  const previous = { language: 'sql', minimap: { enabled: true }, fontSize: 14 }
  const current = { language: 'javascript', minimap: { enabled: true }, fontSize: 20 }
  const next = { language: 'sql', minimap: { enabled: false } }
  const result = syncMonacoOptions(current, next, previous)
  assert.equal(result.language, 'javascript')
  assert.equal(result.minimap.enabled, false)
  assert.equal('fontSize' in result, false)
  next.minimap.enabled = true
  assert.equal(result.minimap.enabled, false)
  assert.equal(current.fontSize, 20)
  const initial = syncMonacoOptions({}, previous)
  previous.minimap.enabled = false
  assert.equal(initial.minimap.enabled, true)
})
