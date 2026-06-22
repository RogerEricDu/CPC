const fs = require('fs')
const path = require('path')

const mapPath = path.resolve(__dirname, '../src/assets/maps/world-cpc.json')
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
const countryCodes = new Map()

for (const feature of map.features || []) {
  const code = feature.properties && feature.properties.name
  const countryName = feature.properties && feature.properties.countryName
  if (!code || !countryName) {
    throw new Error('Every map feature must have a country code and country name.')
  }
  if (countryCodes.has(code)) {
    throw new Error(`Duplicate country code ${code}: ${countryCodes.get(code)} and ${countryName}`)
  }
  countryCodes.set(code, countryName)
}

if (countryCodes.get('CN') !== 'China') {
  throw new Error(`CN must map only to China, found: ${countryCodes.get('CN') || 'missing'}`)
}

console.log(`Validated ${countryCodes.size} unique map country codes.`)
