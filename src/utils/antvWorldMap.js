import geobuf from 'geobuf'
import Pbf from 'pbf'

let worldMapPromise

function assetUrl(filename) {
  const base = process.env.BASE_URL || '/'
  return `${base.replace(/\/?$/, '/')}maps/${filename}`
}

async function fetchGeobuf(filename) {
  const response = await fetch(assetUrl(filename), { credentials: 'same-origin' })
  if (!response.ok) {
    throw new Error(`Unable to load world map data (${response.status}).`)
  }
  return geobuf.decode(new Pbf(new Uint8Array(await response.arrayBuffer())))
}

function extractBoundaryLines(boundaries) {
  const lines = []
  ;(boundaries.features || []).forEach(feature => {
    const geometry = feature.geometry || {}
    const type = String((feature.properties && feature.properties.type) || '').replace(/\0/g, '')
    const groups = geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.type === 'MultiLineString' ? geometry.coordinates : []
    groups.forEach(coordinates => {
      lines.push({
        coords: coordinates,
        lineStyle: {
          color: ['1', '8', '10', '11'].includes(type) ? '#9aa8b8' : '#738399',
          width: ['1', '8', '10', '11'].includes(type) ? 0.65 : 0.9,
          type: ['1', '8', '10', '11'].includes(type) ? 'dashed' : 'solid',
          opacity: 0.9
        }
      })
    })
  })
  return lines
}

export function loadAntvWorldMap() {
  if (!worldMapPromise) {
    worldMapPromise = Promise.all([
      fetchGeobuf('antv-world-polygon.pbf'),
      fetchGeobuf('antv-world-line.pbf')
    ]).then(([polygons, boundaries]) => ({
      polygons,
      boundaryLines: extractBoundaryLines(boundaries)
    }))
      .catch(error => {
        worldMapPromise = null
        throw error
      })
  }
  return worldMapPromise
}
