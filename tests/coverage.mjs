import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import coverageLibrary from 'istanbul-lib-coverage'
import reportLibrary from 'istanbul-lib-report'
import reports from 'istanbul-reports'
import { root, librarySources, instrument } from './helpers/source-runtime.mjs'
const { createCoverageMap } = coverageLibrary
const { createContext } = reportLibrary

const output = path.join(root, 'coverage')
const raw = path.join(output, '.raw')
fs.rmSync(output, { recursive: true, force: true })
fs.mkdirSync(raw, { recursive: true })
const files = fs.readdirSync(path.join(root, 'tests')).filter(name => name.endsWith('.test.mjs')).map(name => path.join(root, 'tests', name))
const result = spawnSync(process.execPath, ['--test', ...files], {
  cwd: root, stdio: 'inherit', env: { ...process.env, VMO_COVERAGE_DIRECTORY: raw }
})
if (result.error) throw result.error

const map = createCoverageMap({})
// Untested executable modules count as zero; type-only files contain no counters.
for (const entry of librarySources()) map.addFileCoverage(instrument(entry.aligned ?? entry.source, entry.filename).coverage)
for (const file of fs.readdirSync(raw)) map.merge(JSON.parse(fs.readFileSync(path.join(raw, file), 'utf8')))
const context = createContext({ dir: output, coverageMap: map })
for (const name of ['text', 'html', 'json', 'json-summary']) reports.create(name).execute(context)
console.log('\nScope: shipped TypeScript and Vue script blocks. Vue templates, CSS, demo code and Monaco internals are not measured by this report.')
const total = map.getCoverageSummary()
const strict = process.argv.includes('--check')
const missed = ['statements', 'branches', 'functions', 'lines'].filter(key => total[key].covered !== total[key].total)
if (strict && missed.length) console.error(`100% coverage gate failed: ${missed.join(', ')}`)
process.exitCode = result.status ?? 1
if (strict && missed.length) process.exitCode = 1
