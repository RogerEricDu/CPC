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

export function loadAntvWorldMap() {
  if (!worldMapPromise) {
    worldMapPromise = Promise.all([
      fetchGeobuf('antv-world-polygon.pbf'),
      fetchGeobuf('antv-world-line.pbf')
    ]).then(([polygons, boundaries]) => ({ polygons, boundaries }))
      .catch(error => {
        worldMapPromise = null
        throw error
      })
  }
  return worldMapPromise
}
