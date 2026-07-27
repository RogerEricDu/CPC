const fs = require('fs')
const path = require('path')
const geobuf = require('geobuf')
const Pbf = require('pbf')

function decode(filename) {
  const source = fs.readFileSync(path.resolve(__dirname, `../public/maps/${filename}`))
  return geobuf.decode(new Pbf(source))
}

const polygons = decode('antv-world-polygon.pbf')
const boundaries = decode('antv-world-line.pbf')

if (!Array.isArray(polygons.features) || polygons.features.length < 200) {
  throw new Error('The AntV standard world polygon dataset is incomplete.')
}
if (!Array.isArray(boundaries.features) || boundaries.features.length !== 8) {
  throw new Error('The AntV standard world boundary dataset is incomplete.')
}

const countryCodes = new Set()
for (const feature of polygons.features) {
  const properties = feature.properties || {}
  if (!properties.SOC) {
    continue
  }
  if (!properties.NAME_CHN || !properties.NAME_ENG) {
    throw new Error(`World polygon ${properties.SOC} is missing standard country metadata.`)
  }
  if (countryCodes.has(properties.SOC)) {
    throw new Error(`Duplicate world polygon country code: ${properties.SOC}`)
  }
  countryCodes.add(properties.SOC)
}
if (countryCodes.size < 240) {
  throw new Error('The AntV standard country metadata is incomplete.')
}

const china = polygons.features.filter(feature => feature.properties && feature.properties.SOC === 'CHN')
if (china.length !== 1 || china[0].properties.NAME_CHN !== '中国') {
  throw new Error('The AntV standard China polygon is missing or duplicated.')
}

const boundaryTypes = new Set(boundaries.features.map(feature =>
  String((feature.properties && feature.properties.type) || '').replace(/\0/g, '')
))
for (const expected of ['0', '1', '2', '7', '8', '9', '10', '11']) {
  if (!boundaryTypes.has(expected)) {
    throw new Error(`The AntV standard boundary type ${expected} is missing.`)
  }
}

console.log(`Validated ${polygons.features.length} AntV world polygons and ${boundaries.features.length} boundary layers.`)
