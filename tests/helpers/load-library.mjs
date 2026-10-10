import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import * as Vue from 'vue'
import * as Ramda from 'ramda'
import MarkdownIt from 'markdown-it'
import { root, transpileModule, runInNewContext } from './source-runtime.mjs'

// Load the actual library scripts, preserving dependency relationships and
// allowing only browser/Monaco boundaries to be replaced in a unit test.
export function createLibraryLoader({ monaco = {}, vue = Vue, globals = {} } = {}) {
  const modules = new Map()
  function load(relative) {
    let filename = path.resolve(root, relative)
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
      filename = [filename + '.ts', filename + '.vue', path.join(filename, 'index.ts')].find(file => fs.existsSync(file))
    }
    if (!filename) throw new Error(`Cannot resolve ${relative}`)
    if (modules.has(filename)) return modules.get(filename)
    const exports = {}
    modules.set(filename, exports)
    const full = fs.readFileSync(filename, 'utf8')
    const source = filename.endsWith('.vue') ? full.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)[1] : full
    const context = { console, ...globals, exports, require(name) {
      if (name === 'vue') return vue
      if (name === 'ramda') return Ramda
      if (name === 'markdown-it') return MarkdownIt
      if (name === 'monaco-editor') return monaco
      if (name.startsWith('monaco-editor/') || name.endsWith('.css')) return {}
      const aliases = { '@lib': 'use.lib', '@comps': 'components', '@type': 'types', '@src': 'src' }
      for (const [alias, directory] of Object.entries(aliases)) {
        if (name === alias || name.startsWith(alias + '/')) return load(directory + name.slice(alias.length))
      }
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name))
      throw new Error(`Unexpected dependency: ${name}`)
    } }
    runInNewContext(transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, context)
    return exports
  }
  return load
}
