const fs = require('fs')
const path = require('path')

const componentPath = path.resolve(__dirname, '../src/components/variant/FrequencyMap.vue')
const assetPath = path.resolve(__dirname, '../src/assets/maps/antv-standard-world.svg')
const rasterPath = path.resolve(__dirname, '../src/assets/maps/antv-standard-world.webp')
const component = fs.readFileSync(componentPath, 'utf8')

for (const forbidden of ['frequencyMapRuntime', 'antvWorldMap', 'boundaryLines', 'echarts.init', 'progressive: 0']) {
  if (component.includes(forbidden)) {
    throw new Error(`Frequency map still contains the blocking runtime path: ${forbidden}`)
  }
}
for (const required of [
  'requestAnimationFrame',
  'translate3d',
  'pointerdown',
  'wheel',
  'antv-standard-world.webp',
  'antv-standard-world.svg',
  'worldMapFallbackUrl'
]) {
  if (!component.includes(required)) {
    throw new Error(`Frequency map is missing the persistent interaction path: ${required}`)
  }
}
for (const required of [
  'const WORLD_WIDTH = 2048',
  'const WORLD_HEIGHT = 2048',
  'Math.max(width / WORLD_WIDTH, height / WORLD_HEIGHT)'
]) {
  if (!component.includes(required)) {
    throw new Error(`Frequency map is missing the undistorted Web Mercator path: ${required}`)
  }
}
if (component.includes('aspect-ratio: 2 / 1')) {
  throw new Error('Frequency map must not force a 2:1 viewport onto Web Mercator geometry.')
}
if (!fs.existsSync(assetPath)) {
  throw new Error('The pre-rendered AntV standard world map is missing.')
}
if (!fs.existsSync(rasterPath)) {
  throw new Error('The optimized AntV standard world raster is missing.')
}
const raster = fs.readFileSync(rasterPath)
if (raster.length > 500_000 || raster.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    raster.subarray(8, 12).toString('ascii') !== 'WEBP') {
  throw new Error(`The optimized world raster is invalid or too large (${raster.length} bytes).`)
}
const asset = fs.readFileSync(assetPath, 'utf8')
if (!asset.includes('width="2048" height="2048" viewBox="0 0 2048 2048"')) {
  throw new Error('The pre-rendered Web Mercator map does not use a square logical canvas.')
}
const countries = (asset.match(/class="country"/g) || []).length
const boundaryLayers = (asset.match(/class="boundary /g) || []).length
if (countries < 240 || boundaryLayers !== 8) {
  throw new Error(`Pre-rendered map is incomplete: ${countries} countries, ${boundaryLayers} boundary layers.`)
}

console.log(`Validated persistent frequency map with ${countries} countries and ${boundaryLayers} boundary layers.`)
