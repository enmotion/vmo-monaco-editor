import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import { createInstrumenter } from 'istanbul-lib-instrument'

export const root = fileURLToPath(new URL('../..', import.meta.url))

// Keep original line positions, including the offset of a Vue script block.
export function librarySources() {
  const sources = []
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(filename)
      else if (/\.(vue|ts)$/.test(filename) && !filename.endsWith('.d.ts')) {
        const full = fs.readFileSync(filename, 'utf8')
        if (filename.endsWith('.vue')) {
          const match = /<script\b[^>]*>([\s\S]*?)<\/script>/.exec(full)
          if (match) {
            const offset = full.slice(0, match.index + match[0].indexOf('>') + 1).split('\n').length - 1
            sources.push({ filename, source: match[1], aligned: '\n'.repeat(offset) + match[1] })
          }
        } else sources.push({ filename, source: full, aligned: full })
      }
    }
  }
  visit(path.join(root, 'components'))
  visit(path.join(root, 'use.lib'))
  sources.push({ filename: path.join(root, 'index.ts'), source: fs.readFileSync(path.join(root, 'index.ts'), 'utf8') })
  return sources
}

export function instrument(source, filename) {
  const instrumenter = createInstrumenter({ parserPlugins: ['typescript'] })
  const code = instrumenter.instrumentSync(source, filename)
  return { code, coverage: instrumenter.lastFileCoverage() }
}

const coverage = {}
const catalog = process.env.VMO_COVERAGE_DIRECTORY ? librarySources() : []

export function transpileModule(source, options) {
  if (process.env.VMO_COVERAGE_DIRECTORY) {
    const entry = catalog.find(entry => entry.source.trim() === source.trim())
    if (!entry) throw new Error('Coverage cannot identify this script; add it to the source catalog.')
    source = instrument(entry.aligned ?? entry.source, entry.filename).code
  }
  return ts.transpileModule(source, {
    ...options,
    compilerOptions: { target: ts.ScriptTarget.ES2020, ...options?.compilerOptions }
  })
}

export function runInNewContext(code, context, options) {
  return vm.runInNewContext(code, { ...context, __coverage__: coverage }, options)
}

if (process.env.VMO_COVERAGE_DIRECTORY) {
  process.on('exit', () => {
    fs.mkdirSync(process.env.VMO_COVERAGE_DIRECTORY, { recursive: true })
    fs.writeFileSync(path.join(process.env.VMO_COVERAGE_DIRECTORY, `${process.pid}.json`), JSON.stringify(coverage))
  })
}
