const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const geobuf = require('geobuf')
const PbfModule = require('pbf')

const Pbf = PbfModule.default || PbfModule
const width = 2048
const height = 2048
const rasterWidth = 2048
const rasterHeight = 2048
const sourceDirectory = path.resolve(__dirname, '../public/maps')
const outputPath = path.resolve(__dirname, '../src/assets/maps/antv-standard-world.svg')

function readSource(filename) {
  const buffer = fs.readFileSync(path.join(sourceDirectory, filename))
  return {
    buffer,
    data: geobuf.decode(new Pbf(buffer))
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function format(value) {
  return Number(value.toFixed(2)).toString()
}

function project(coordinate) {
  const longitude = Math.max(-180, Math.min(180, Number(coordinate[0]) || 0))
  const latitude = Math.max(-85.051129, Math.min(85.051129, Number(coordinate[1]) || 0))
  const latitudeRadians = latitude * Math.PI / 180
  const x = (longitude + 180) / 360 * width
  const y = (1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2 * height
  return `${format(x)} ${format(y)}`
}

function linePath(coordinates, close) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return ''
  const commands = coordinates.map((coordinate, index) => `${index === 0 ? 'M' : 'L'}${project(coordinate)}`)
  if (close) commands.push('Z')
  return commands.join('')
}

function polygonPath(geometry) {
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
  return polygons.flatMap(polygon => polygon.map(ring => linePath(ring, true))).join('')
}

function boundaryPath(geometry) {
  const lines = geometry.type === 'LineString'
    ? [geometry.coordinates]
    : geometry.type === 'MultiLineString' ? geometry.coordinates : []
  return lines.map(line => linePath(line, false)).join('')
}

const polygons = readSource('antv-world-polygon.pbf')
const boundaries = readSource('antv-world-line.pbf')

const countryPaths = (polygons.data.features || []).map(feature => {
  const code = String((feature.properties && feature.properties.SOC) || '')
  return `<path class="country" data-code="${code}" d="${polygonPath(feature.geometry || {})}"/>`
}).join('')

const boundaryPaths = (boundaries.data.features || []).map(feature => {
  const type = String((feature.properties && feature.properties.type) || '').replace(/\0/g, '')
  const secondary = ['1', '8', '10', '11'].includes(type)
  return `<path class="boundary ${secondary ? 'boundary-secondary' : 'boundary-primary'}" data-type="${type}" d="${boundaryPath(feature.geometry || {})}"/>`
}).join('')

const metadata = JSON.stringify({
  source: 'AntV standard world map',
  polygonSha256: sha256(polygons.buffer),
  boundarySha256: sha256(boundaries.buffer),
  polygons: (polygons.data.features || []).length,
  boundaryLayers: (boundaries.data.features || []).length
})

const svg = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<svg xmlns="http://www.w3.org/2000/svg" width="${rasterWidth}" height="${rasterHeight}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`,
  `<metadata>${metadata}</metadata>`,
  '<style>.country{fill:#e9eef5;stroke:#b7c2cf;stroke-width:var(--country-stroke,.55);stroke-linejoin:round;fill-rule:evenodd;vector-effect:non-scaling-stroke;transition:fill 120ms ease-out,stroke 120ms ease-out}.country:hover{fill:#dce6f2;stroke:#7f91a7}.boundary{fill:none;stroke-linecap:round;stroke-linejoin:round;pointer-events:none;vector-effect:non-scaling-stroke}.boundary-primary{stroke:#738399;stroke-width:var(--boundary-primary-stroke,.9)}.boundary-secondary{stroke:#9aa8b8;stroke-width:var(--boundary-secondary-stroke,.65);stroke-dasharray:var(--boundary-secondary-dash,2.4 1.8)}</style>',
  `<rect width="${width}" height="${height}" fill="#f8fafc"/>`,
  `<g id="countries">${countryPaths}</g>`,
  `<g id="standard-boundaries">${boundaryPaths}</g>`,
  '</svg>'
].join('')

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, svg)
console.log(`Generated ${path.relative(process.cwd(), outputPath)} (${Buffer.byteLength(svg)} bytes).`)
