const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const compiler = require('vue-template-compiler')

const root = path.resolve(__dirname, '..')

function componentOptions(file, imports) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  const component = compiler.parseComponent(source)
  const compiled = compiler.compile(component.template.content)
  assert.deepEqual(compiled.errors, [], `${file} template should compile`)
  const script = component.script.content
    .replace(/^import .+ from .+$/gm, '')
    .replace('export default', 'return')
  return new Function(...Object.keys(imports), script)(...Object.values(imports))
}

async function loadTable(payload, error) {
  const requests = []
  const component = componentOptions('src/components/MyTable.vue', {
    axios: {
      get: async url => {
        requests.push(url)
        if (error) throw error
        return { data: payload }
      }
    }
  })
  const context = { ...component.data(), jsonPath: 'table_json/Table S1.json' }
  await component.methods.getTableData.call(context)
  assert.deepEqual(requests, [context.jsonPath])
  return context
}

test('Phase I requests exactly the existing supplementary tables S1–S24', () => {
  const phasei = componentOptions('src/views/phasei/index.vue', { MyTable: {} })
  const numbers = phasei.data().tableNums
  assert.deepEqual(numbers, Array.from({ length: 24 }, (_, index) => index + 1))
  numbers.forEach(number => assert(fs.existsSync(path.join(root, `public/table_json/Table S${number}.json`))))
})

test('all 24 real tables load without changing their source data', async () => {
  for (let number = 1; number <= 24; number += 1) {
    const raw = fs.readFileSync(path.join(root, `public/table_json/Table S${number}.json`), 'utf8')
    const payload = JSON.parse(raw)
    const original = JSON.parse(raw)
    const context = await loadTable(payload)
    assert.equal(context.tableName, original[0].tableName)
    assert.deepEqual(context.colHeader, original[0].colHeader)
    assert.deepEqual(context.tdata, original.slice(1))
    assert.deepEqual(payload, original, `S${number}: do not mutate the HTTP response`)
    assert.equal(context.errorMessage, '')
  }
})

test('an HTML SPA fallback cannot render character-by-character as table rows', async () => {
  const context = await loadTable('<!doctype html><html><body>CPC</body></html>')
  assert.equal(context.tableName, '')
  assert.deepEqual(context.colHeader, [])
  assert.deepEqual(context.tdata, [])
  assert.equal(context.errorMessage, 'Unable to load this supplementary table.')
})

test('malformed metadata and rows do not become visible table data', async () => {
  const invalidPayloads = [
    null, {}, [], [{}], [{ tableName: 'S1', colHeader: 'not an array' }],
    [{ tableName: 'S1', colHeader: ['Sample'] }, 'a string row'],
    [{ tableName: 'S1', colHeader: ['Sample'] }, null],
    [{ tableName: 'S1', colHeader: ['Sample'] }, []]
  ]
  for (const payload of invalidPayloads) {
    const context = await loadTable(payload)
    assert.deepEqual(context.tdata, [])
    assert.equal(context.errorMessage, 'Unable to load this supplementary table.')
  }
})

test('request failures show a table-local error instead of an unhandled rejection', async () => {
  const context = await loadTable(undefined, new Error('HTTP 404'))
  assert.deepEqual(context.tdata, [])
  assert.equal(context.errorMessage, 'Unable to load this supplementary table.')
})

test('a valid table with no data rows still renders its title and headers', async () => {
  const context = await loadTable([{ tableName: 'Table S1', colHeader: ['Sample'] }])
  assert.equal(context.tableName, 'Table S1')
  assert.deepEqual(context.colHeader, ['Sample'])
  assert.deepEqual(context.tdata, [])
  assert.equal(context.errorMessage, '')
})
