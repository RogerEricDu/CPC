<template>
  <section class="frequency-panel">
    <div class="panel-heading">
      <div>
        <h3>Population frequency distribution</h3>
        <p>{{ frequency.variantId }} · {{ frequency.assembly }}</p>
      </div>
      <div class="heading-actions">
        <div v-if="hasRegionalData" class="map-mode-toggle" role="group" aria-label="Frequency map aggregation">
          <button
            type="button"
            :class="{ active: displayMode === 'continent' }"
            @click="setDisplayMode('continent')"
          >Continent</button>
          <button
            type="button"
            :class="{ active: displayMode === 'population' }"
            @click="setDisplayMode('population')"
          >Population</button>
        </div>
        <div class="global-frequency">
          <strong>{{ formatPercent(frequency.globalFrequency) }}</strong>
          <span>{{ formatInteger(frequency.variantAlleles) }} / {{ formatInteger(frequency.totalAlleles) }} alleles</span>
        </div>
      </div>
    </div>

    <div v-if="hasRegionalData" class="map-stage">
      <div
        ref="viewport"
        class="map-viewport"
        :class="{ dragging }"
        role="application"
        :aria-label="`${displayMode} frequency map for ${frequency.variantId}`"
        tabindex="0"
        @wheel.prevent="handleWheel"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @dblclick.prevent="handleDoubleClick"
        @keydown="handleKeydown"
      >
        <div ref="worldLayer" class="world-layer">
          <img
            class="world-map-image"
            :src="worldMapUrl"
            width="2048"
            height="2048"
            decoding="async"
            alt=""
            draggable="false"
            @load="handleMapLoad"
            @error="handleMapError"
          >

          <div
            v-for="item in displayItems"
            :key="item.mapKey"
            class="frequency-marker"
            :class="{ hovered: hoveredKey === item.mapKey }"
            :style="markerStyle(item)"
          >
            <button
              type="button"
              class="frequency-ring"
              :aria-label="`${item.label}: ${formatPercent(item.variantFrequency)} variant frequency`"
              @pointerenter="showTooltip(item, $event)"
              @pointermove="moveTooltip(item, $event)"
              @pointerleave="hideTooltip"
              @focus="showKeyboardTooltip(item, $event)"
              @blur="hideTooltip"
            ></button>
            <span v-if="item.showLabel" class="marker-label">
              <strong>{{ item.label }}</strong>
              <small v-if="displayMode === 'continent'">{{ formatPercent(item.variantFrequency) }}</small>
            </span>
          </div>
        </div>

        <div class="map-controls" aria-label="Map controls" @pointerdown.stop>
          <button type="button" title="Zoom in" aria-label="Zoom in" @click="zoomBy(1.45)">+</button>
          <button type="button" title="Zoom out" aria-label="Zoom out" @click="zoomBy(1 / 1.45)">−</button>
          <button type="button" title="Reset map" aria-label="Reset map" @click="resetView">⌂</button>
        </div>

        <div v-if="!imageLoaded && !mapError" class="map-status">Loading map...</div>
        <div v-else-if="mapError" class="map-status map-error">{{ mapError }}</div>
        <div
          v-show="tooltip.visible"
          ref="tooltip"
          class="map-tooltip"
          role="status"
        >
          <strong>{{ tooltip.label }}</strong>
          <span>Variant frequency: {{ formatPercent(tooltip.variantFrequency) }}</span>
          <span>Variant alleles: {{ formatInteger(tooltip.variantAlleles) }}</span>
          <span>Total alleles: {{ formatInteger(tooltip.totalAlleles) }}</span>
          <span v-if="tooltip.segmentLabel">{{ tooltip.segmentLabel }}: {{ formatInteger(tooltip.segmentValue) }}</span>
        </div>
      </div>
    </div>

    <div v-if="hasRegionalData" class="frequency-legend" aria-hidden="true">
      <span><i class="variant-swatch"></i>Variant allele</span>
      <span><i class="reference-swatch"></i>Reference allele</span>
    </div>
    <div v-else class="frequency-unavailable">Only the global frequency is available for this variant.</div>
  </section>
</template>

<script>
import worldMapUrl from '@/assets/maps/antv-standard-world.webp'

const WORLD_WIDTH = 2048
const WORLD_HEIGHT = 2048
const MAX_ZOOM = 4
let preloadedWorldMap = null

function preloadWorldMap() {
  if (preloadedWorldMap || typeof window === 'undefined' || !window.Image) return
  preloadedWorldMap = new window.Image()
  preloadedWorldMap.decoding = 'async'
  preloadedWorldMap.src = worldMapUrl
  if (typeof preloadedWorldMap.decode === 'function') {
    preloadedWorldMap.decode().catch(() => {})
  }
}

preloadWorldMap()

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function project(longitude, latitude) {
  const lon = clamp(Number(longitude) || 0, -180, 180)
  const lat = clamp(Number(latitude) || 0, -85.051129, 85.051129)
  const radians = lat * Math.PI / 180
  return {
    x: (lon + 180) / 360 * WORLD_WIDTH,
    y: (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2 * WORLD_HEIGHT
  }
}

export default {
  name: 'FrequencyMap',
  props: {
    frequency: {
      type: Object,
      required: true
    },
    preferredPopulation: {
      type: String,
      default: ''
    }
  },
  beforeCreate() {
    this._view = { x: 0, y: 0, scale: 1, baseScale: 1 }
    this._viewportSize = { width: 0, height: 0 }
    this._resizeObserver = null
    this._resizeFrame = null
    this._panFrame = null
    this._pendingPanView = null
    this._wheelFrame = null
    this._wheelDelta = 0
    this._wheelPoint = null
    this._dragStart = null
  },
  data() {
    return {
      worldMapUrl,
      displayMode: this.preferredPopulation ? 'population' : 'continent',
      imageLoaded: false,
      mapError: '',
      dragging: false,
      hoveredKey: '',
      hoveredSegment: '',
      tooltip: {
        visible: false,
        label: '',
        variantFrequency: 0,
        variantAlleles: 0,
        totalAlleles: 0,
        segmentLabel: '',
        segmentValue: 0
      }
    }
  },
  computed: {
    hasRegionalData() {
      const regions = Array.isArray(this.frequency && this.frequency.regions)
        ? this.frequency.regions
        : []
      return regions.some(region => {
        if (this.hasCoordinate(region.latitude) && this.hasCoordinate(region.longitude)) return true
        return (region.populations || []).some(population => (
          this.hasCoordinate(population.latitude) && this.hasCoordinate(population.longitude)
        ))
      })
    },
    displayItems() {
      const regions = Array.isArray(this.frequency && this.frequency.regions)
        ? this.frequency.regions
        : []
      let items
      if (this.displayMode === 'continent') {
        items = regions
          .filter(item => this.hasCoordinate(item.latitude) && this.hasCoordinate(item.longitude))
          .map(item => ({
            ...item,
            mapKey: `continent:${item.code}`,
            label: item.label,
            showLabel: true,
            radius: 25,
            innerRadius: 15
          }))
      } else {
        items = []
        regions.forEach(region => {
          const populations = region.populations || []
          populations.forEach(population => {
            if (!this.hasCoordinate(population.latitude) || !this.hasCoordinate(population.longitude)) return
            items.push({
              ...population,
              mapKey: `population:${population.population}`,
              label: population.population,
              showLabel: false,
              radius: 10,
              innerRadius: 5
            })
          })
        })
        const labelCandidates = items
          .filter(item => Number(item.variantAlleles) > 0)
          .sort((left, right) => Number(right.variantFrequency) - Number(left.variantFrequency))
        const selectedLabels = []
        for (const candidate of labelCandidates) {
          const position = project(candidate.longitude, candidate.latitude)
          const hasSpace = selectedLabels.every(selected => {
            const deltaX = selected.x - position.x
            const deltaY = selected.y - position.y
            return deltaX * deltaX + deltaY * deltaY >= 180 * 180
          })
          if (hasSpace) selectedLabels.push({ ...position, mapKey: candidate.mapKey })
          if (selectedLabels.length >= 10) break
        }
        const labels = new Set(selectedLabels.map(item => item.mapKey))
        items.forEach(item => { item.showLabel = labels.has(item.mapKey) })
      }
      return items.map(item => ({ ...item, ...project(item.longitude, item.latitude) }))
    }
  },
  watch: {
    frequency() {
      this.hideTooltip()
    },
    preferredPopulation(value) {
      if (value) this.setDisplayMode('population')
    },
    hasRegionalData(value) {
      if (value) this.$nextTick(() => this.measureViewport(false))
    }
  },
  mounted() {
    window.addEventListener('resize', this.scheduleResize)
    if (typeof ResizeObserver !== 'undefined' && this.$refs.viewport) {
      this._resizeObserver = new ResizeObserver(this.scheduleResize)
      this._resizeObserver.observe(this.$refs.viewport)
    }
    this.$nextTick(() => this.measureViewport(true))
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.scheduleResize)
    if (this._resizeObserver) this._resizeObserver.disconnect()
    if (this._resizeFrame) cancelAnimationFrame(this._resizeFrame)
    if (this._panFrame) cancelAnimationFrame(this._panFrame)
    if (this._wheelFrame) cancelAnimationFrame(this._wheelFrame)
  },
  methods: {
    hasCoordinate(value) {
      return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
    },
    formatPercent(value) {
      return `${((Number(value) || 0) * 100).toFixed(2)}%`
    },
    formatInteger(value) {
      return Number(value || 0).toLocaleString()
    },
    setDisplayMode(mode) {
      if (mode === this.displayMode) return
      this.hideTooltip()
      this.displayMode = mode
    },
    markerStyle(item) {
      const frequency = clamp(Number(item.variantFrequency) || 0, 0, 1)
      const variantColor = this.hoveredKey === item.mapKey && this.hoveredSegment === 'variant'
        ? '#e45b70'
        : '#d1495b'
      const referenceColor = this.hoveredKey === item.mapKey && this.hoveredSegment === 'reference'
        ? '#c5d2df'
        : '#dbe4ee'
      return {
        left: `${item.x}px`,
        top: `${item.y}px`,
        '--marker-size': `${item.radius * 2}px`,
        '--inner-size': `${item.innerRadius * 2}px`,
        '--variant-angle': `${frequency * 360}deg`,
        '--variant-color': variantColor,
        '--reference-color': referenceColor,
        '--label-offset': `${item.radius + 8}px`
      }
    },
    handleMapLoad() {
      this.imageLoaded = true
      this.mapError = ''
      this.$nextTick(() => this.measureViewport(true))
    },
    handleMapError() {
      this.imageLoaded = false
      this.mapError = 'Unable to load the frequency map.'
    },
    scheduleResize() {
      if (this._resizeFrame) cancelAnimationFrame(this._resizeFrame)
      this._resizeFrame = requestAnimationFrame(() => {
        this._resizeFrame = null
        this.measureViewport(false)
      })
    },
    measureViewport(reset) {
      const viewport = this.$refs.viewport
      if (!viewport) return
      const width = viewport.clientWidth
      const height = viewport.clientHeight
      if (!width || !height) return

      const previous = this._viewportSize
      const previousView = this._view
      const baseScale = Math.max(width / WORLD_WIDTH, height / WORLD_HEIGHT)
      let scale = baseScale
      let centerWorldX = WORLD_WIDTH / 2
      let centerWorldY = WORLD_HEIGHT / 2

      if (!reset && previous.width && previous.height && previousView.scale) {
        centerWorldX = (previous.width / 2 - previousView.x) / previousView.scale
        centerWorldY = (previous.height / 2 - previousView.y) / previousView.scale
        scale = clamp(baseScale * (previousView.scale / previousView.baseScale), baseScale, baseScale * MAX_ZOOM)
      }

      this._viewportSize = { width, height }
      this.applyView({
        x: width / 2 - centerWorldX * scale,
        y: height / 2 - centerWorldY * scale,
        scale,
        baseScale
      })
    },
    constrainView(view) {
      const width = this._viewportSize.width
      const height = this._viewportSize.height
      const worldWidth = WORLD_WIDTH * view.scale
      const worldHeight = WORLD_HEIGHT * view.scale
      const x = worldWidth <= width
        ? (width - worldWidth) / 2
        : clamp(view.x, width - worldWidth, 0)
      const y = worldHeight <= height
        ? (height - worldHeight) / 2
        : clamp(view.y, height - worldHeight, 0)
      return { ...view, x, y }
    },
    applyView(nextView) {
      const view = this.constrainView(nextView)
      this._view = view
      const layer = this.$refs.worldLayer
      if (!layer) return
      layer.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`
      layer.style.setProperty('--marker-scale', String(1 / view.scale))
    },
    resetView() {
      this.hideTooltip()
      this.measureViewport(true)
    },
    zoomBy(factor) {
      const viewport = this.$refs.viewport
      if (!viewport) return
      const rect = viewport.getBoundingClientRect()
      this.zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor)
    },
    zoomAt(clientX, clientY, factor) {
      const viewport = this.$refs.viewport
      if (!viewport) return
      const rect = viewport.getBoundingClientRect()
      const pointX = clientX - rect.left
      const pointY = clientY - rect.top
      const current = this._view
      const scale = clamp(current.scale * factor, current.baseScale, current.baseScale * MAX_ZOOM)
      if (Math.abs(scale - current.scale) < 0.000001) return
      const worldX = (pointX - current.x) / current.scale
      const worldY = (pointY - current.y) / current.scale
      this.hideTooltip()
      this.applyView({
        ...current,
        x: pointX - worldX * scale,
        y: pointY - worldY * scale,
        scale
      })
    },
    handleWheel(event) {
      this._wheelDelta += event.deltaY
      this._wheelPoint = { x: event.clientX, y: event.clientY }
      if (this._wheelFrame) return
      this._wheelFrame = requestAnimationFrame(() => {
        this._wheelFrame = null
        const delta = this._wheelDelta
        const point = this._wheelPoint
        this._wheelDelta = 0
        this.zoomAt(point.x, point.y, Math.exp(-delta * 0.0015))
      })
    },
    handleDoubleClick(event) {
      this.zoomAt(event.clientX, event.clientY, 1.8)
    },
    handlePointerDown(event) {
      if (event.button !== 0 || event.target.closest('.frequency-marker, .map-controls')) return
      this.hideTooltip()
      this.dragging = true
      this._dragStart = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        x: this._view.x,
        y: this._view.y
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    handlePointerMove(event) {
      const start = this._dragStart
      if (!start || start.pointerId !== event.pointerId) return
      const next = {
        ...this._view,
        x: start.x + event.clientX - start.clientX,
        y: start.y + event.clientY - start.clientY
      }
      this._pendingPanView = next
      if (this._panFrame) cancelAnimationFrame(this._panFrame)
      this._panFrame = requestAnimationFrame(() => {
        this._panFrame = null
        this.applyView(this._pendingPanView)
        this._pendingPanView = null
      })
    },
    handlePointerUp(event) {
      if (!this._dragStart || this._dragStart.pointerId !== event.pointerId) return
      if (this._panFrame) {
        cancelAnimationFrame(this._panFrame)
        this._panFrame = null
        this.applyView(this._pendingPanView)
      }
      this._pendingPanView = null
      this.dragging = false
      this._dragStart = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    },
    handleKeydown(event) {
      const current = this._view
      const pan = 70
      if (event.key === '+' || event.key === '=') this.zoomBy(1.35)
      else if (event.key === '-' || event.key === '_') this.zoomBy(1 / 1.35)
      else if (event.key === '0' || event.key === 'Home') this.resetView()
      else if (event.key === 'ArrowLeft') this.applyView({ ...current, x: current.x + pan })
      else if (event.key === 'ArrowRight') this.applyView({ ...current, x: current.x - pan })
      else if (event.key === 'ArrowUp') this.applyView({ ...current, y: current.y + pan })
      else if (event.key === 'ArrowDown') this.applyView({ ...current, y: current.y - pan })
      else return
      event.preventDefault()
    },
    segmentAt(item, event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - (rect.left + rect.width / 2)
      const y = event.clientY - (rect.top + rect.height / 2)
      const distance = Math.sqrt(x * x + y * y)
      if (distance < rect.width * item.innerRadius / item.radius / 2) return ''
      const ratio = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2)
      return ratio <= clamp(Number(item.variantFrequency) || 0, 0, 1) ? 'variant' : 'reference'
    },
    tooltipFor(item, segment) {
      const total = Math.max(0, Number(item.totalAlleles) || 0)
      const variant = Math.max(0, Math.min(total, Number(item.variantAlleles) || 0))
      return {
        visible: true,
        label: item.label,
        variantFrequency: item.variantFrequency,
        variantAlleles: variant,
        totalAlleles: total,
        segmentLabel: segment === 'variant' ? 'Variant allele' : segment === 'reference' ? 'Reference allele' : '',
        segmentValue: segment === 'variant' ? variant : segment === 'reference' ? total - variant : 0
      }
    },
    showTooltip(item, event) {
      const segment = this.segmentAt(item, event)
      this.hoveredKey = item.mapKey
      this.hoveredSegment = segment
      this.tooltip = this.tooltipFor(item, segment)
      this.$nextTick(() => this.positionTooltip(event))
    },
    moveTooltip(item, event) {
      const segment = this.segmentAt(item, event)
      if (segment !== this.hoveredSegment) {
        this.hoveredSegment = segment
        this.tooltip = this.tooltipFor(item, segment)
      }
      this.positionTooltip(event)
    },
    showKeyboardTooltip(item, event) {
      this.hoveredKey = item.mapKey
      this.hoveredSegment = 'variant'
      this.tooltip = this.tooltipFor(item, 'variant')
      this.$nextTick(() => {
        const rect = event.currentTarget.getBoundingClientRect()
        this.positionTooltip({ clientX: rect.left + rect.width / 2, clientY: rect.top })
      })
    },
    positionTooltip(event) {
      const viewport = this.$refs.viewport
      const tooltip = this.$refs.tooltip
      if (!viewport || !tooltip) return
      const rect = viewport.getBoundingClientRect()
      const width = tooltip.offsetWidth || 220
      const height = tooltip.offsetHeight || 130
      const left = clamp(event.clientX - rect.left + 14, 8, Math.max(8, rect.width - width - 8))
      const top = clamp(event.clientY - rect.top - height - 12, 8, Math.max(8, rect.height - height - 8))
      tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`
    },
    hideTooltip() {
      this.hoveredKey = ''
      this.hoveredSegment = ''
      this.tooltip.visible = false
    }
  }
}
</script>

<style scoped>
.frequency-panel {
  margin: 26px 0;
  padding: 22px;
  border: 1px solid #dce3ec;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(32, 52, 84, 0.07);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 10px;
}

.panel-heading h3 {
  margin: 0 0 5px;
  color: #213a66;
  font-size: 1.24rem;
}

.panel-heading p {
  margin: 0;
  color: #68778b;
  font-size: 0.9rem;
}

.heading-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.map-mode-toggle {
  display: inline-flex;
  padding: 3px;
  border: 1px solid #c9d4e1;
  border-radius: 7px;
  background: #f2f5f9;
}

.map-mode-toggle button {
  padding: 7px 13px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #52657b;
  font-weight: 600;
  cursor: pointer;
}

.map-mode-toggle button.active {
  background: #315f93;
  color: #fff;
  box-shadow: 0 2px 5px rgba(32, 56, 86, 0.22);
}

.global-frequency {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #65758a;
  font-size: 0.82rem;
}

.global-frequency strong {
  color: #b9364a;
  font-size: 1.45rem;
  line-height: 1.2;
}

.map-stage {
  position: relative;
  min-height: 500px;
}

.map-viewport {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
  border: 1px solid #dbe3ed;
  border-radius: 9px;
  background: #f8fafc;
  cursor: grab;
  touch-action: none;
  user-select: none;
  contain: strict;
  outline: none;
}

.map-viewport:focus-visible {
  box-shadow: 0 0 0 3px rgba(49, 95, 147, 0.2);
}

.map-viewport.dragging { cursor: grabbing; }

.world-layer {
  --marker-scale: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 2048px;
  height: 2048px;
  transform-origin: 0 0;
  will-change: transform;
  backface-visibility: hidden;
}

.world-map-image {
  display: block;
  width: 2048px;
  height: 2048px;
  pointer-events: none;
  -webkit-user-drag: none;
}

.frequency-marker {
  position: absolute;
  z-index: 2;
  width: var(--marker-size);
  height: var(--marker-size);
  transform: translate(-50%, -50%) scale(var(--marker-scale));
  transform-origin: center;
  will-change: transform;
}

.frequency-ring {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.96);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    var(--variant-color) 0 var(--variant-angle),
    var(--reference-color) var(--variant-angle) 360deg
  );
  box-shadow: 0 2px 7px rgba(30, 52, 82, 0.22);
  cursor: pointer;
  transition: transform 100ms ease-out, box-shadow 100ms ease-out;
}

.frequency-ring::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--inner-size);
  height: var(--inner-size);
  border-radius: 50%;
  background: #fff;
  content: '';
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.frequency-marker.hovered {
  z-index: 20;
}

.frequency-marker.hovered .frequency-ring,
.frequency-ring:focus-visible {
  transform: scale(1.18);
  box-shadow: 0 5px 15px rgba(25, 48, 82, 0.34);
  outline: none;
}

.marker-label {
  position: absolute;
  top: calc(50% + var(--label-offset));
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #1f2d3d;
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
  text-shadow: 0 1px 2px #fff, 0 0 3px #fff;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}

.marker-label strong { font-weight: 700; }
.marker-label small { margin-top: 1px; font-size: 9px; }

.map-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #cbd6e2;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(31, 51, 79, 0.16);
}

.map-controls button {
  width: 36px;
  height: 34px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid #e1e7ee;
  background: #fff;
  color: #29486e;
  font-size: 20px;
  font-weight: 600;
  line-height: 34px;
  cursor: pointer;
}

.map-controls button:last-child { border-bottom: 0; font-size: 17px; }
.map-controls button:hover { background: #edf3f9; }
.map-controls button:active { background: #dfeaf5; }

.map-status {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #64758a;
}

.map-error { color: #a62c3d; }

.map-tooltip {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 50;
  display: flex;
  min-width: 215px;
  padding: 10px 12px;
  border-radius: 7px;
  background: rgba(24, 39, 65, 0.96);
  box-shadow: 0 5px 18px rgba(18, 32, 51, 0.28);
  color: #fff;
  font-size: 12px;
  line-height: 1.45;
  flex-direction: column;
  pointer-events: none;
  will-change: transform;
}

.map-tooltip strong { margin-bottom: 2px; font-size: 13px; }

.frequency-unavailable {
  margin-top: 18px;
  padding: 18px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #5e6d80;
  text-align: center;
}

.frequency-legend {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-top: 10px;
  color: #56667a;
  font-size: 0.86rem;
}

.frequency-legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.frequency-legend i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.variant-swatch { background: #d1495b; }
.reference-swatch { background: #dbe4ee; border: 1px solid #b7c4d3; }

@media (max-width: 900px) {
  .panel-heading,
  .heading-actions { flex-direction: column; }
  .heading-actions { align-items: flex-start; gap: 12px; }
  .global-frequency { align-items: flex-start; }
}

@media (max-width: 760px) {
  .map-stage { min-height: 390px; }
  .map-viewport { height: 390px; }
}

@media (prefers-reduced-motion: reduce) {
  .frequency-ring { transition: none; }
}
</style>
