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
      <div v-if="mapLoading" class="map-status">Loading map...</div>
      <div v-else-if="mapError" class="map-status map-error">{{ mapError }}</div>
      <div
        v-show="!mapLoading && !mapError"
        ref="chart"
        class="frequency-map"
        role="img"
        :aria-label="`${displayMode} frequency map for ${frequency.variantId}`"
      ></div>
    </div>
    <div v-if="hasRegionalData" class="frequency-legend" aria-hidden="true">
      <span><i class="variant-swatch"></i>Variant allele</span>
      <span><i class="reference-swatch"></i>Reference allele</span>
    </div>
    <div v-else class="frequency-unavailable">Only the global frequency is available for this variant.</div>
  </section>
</template>

<script>
const MAP_NAME = 'cpc-antv-standard-world'
let mapRegistered = false
let frequencyMapRuntimePromise

function loadFrequencyMapRuntime() {
  if (!frequencyMapRuntimePromise) {
    frequencyMapRuntimePromise = Promise.all([
      import(/* webpackChunkName: "frequency-map-runtime" */ '@/utils/frequencyMapRuntime'),
      import(/* webpackChunkName: "frequency-map-runtime" */ '@/utils/antvWorldMap')
    ]).then(([echartsModule, mapModule]) => ({
      echarts: echartsModule.default,
      loadAntvWorldMap: mapModule.loadAntvWorldMap
    })).catch(error => {
      frequencyMapRuntimePromise = null
      throw error
    })
  }
  return frequencyMapRuntimePromise
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
    this._echarts = null
    this._mapCancelled = false
    this._resizeFrame = null
  },
  data() {
    return {
      chart: null,
      boundaryLines: [],
      displayMode: this.preferredPopulation ? 'population' : 'continent',
      mapLoading: true,
      mapError: ''
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
    }
  },
  watch: {
    frequency() {
      this.renderChart()
    },
    preferredPopulation(value) {
      if (value) this.setDisplayMode('population')
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    if (this.hasRegionalData) {
      this.initializeMap()
    } else {
      this.mapLoading = false
    }
  },
  beforeDestroy() {
    this._mapCancelled = true
    window.removeEventListener('resize', this.handleResize)
    if (this._resizeFrame) cancelAnimationFrame(this._resizeFrame)
    if (this.chart) {
      this.chart.off('mouseover', this.handleRingMouseOver)
      this.chart.off('mouseout', this.handleRingMouseOut)
      this.chart.dispose()
    }
  },
  methods: {
    async initializeMap() {
      this.mapLoading = true
      this.mapError = ''
      try {
        const { echarts, loadAntvWorldMap } = await loadFrequencyMapRuntime()
        const { polygons, boundaryLines } = await loadAntvWorldMap()
        if (this._mapCancelled) return
        this._echarts = echarts
        if (!mapRegistered) {
          echarts.registerMap(MAP_NAME, polygons)
          mapRegistered = true
        }
        this.boundaryLines = boundaryLines
        this.mapLoading = false
        await this.$nextTick()
        if (this._mapCancelled || !this.$refs.chart) return
        this.chart = echarts.init(this.$refs.chart)
        this.chart.on('mouseover', this.handleRingMouseOver)
        this.chart.on('mouseout', this.handleRingMouseOut)
        this.chart.setOption(this.createBaseOption(), { notMerge: true })
        this.renderChart()
      } catch (error) {
        this.mapLoading = false
        this.mapError = 'Unable to load the frequency map.'
      }
    },
    createBaseOption() {
      return {
        animation: false,
        tooltip: {
          trigger: 'item',
          confine: true,
          backgroundColor: 'rgba(24, 39, 65, 0.96)',
          borderWidth: 0,
          textStyle: { color: '#fff' },
          formatter: params => this.tooltipContent(params)
        },
        geo: {
          map: MAP_NAME,
          nameProperty: 'SOC',
          roam: true,
          center: [15, 24],
          zoom: 1.08,
          scaleLimit: { min: 0.8, max: 7 },
          itemStyle: {
            areaColor: '#e9eef5',
            borderWidth: 0
          },
          emphasis: {
            itemStyle: { areaColor: '#dce6f2' },
            label: { show: false }
          },
          select: { disabled: true }
        },
        series: []
      }
    },
    setDisplayMode(mode) {
      if (mode === this.displayMode) return
      this.hideTooltip()
      this.displayMode = mode
      this.renderChart()
    },
    displayItems() {
      const regions = Array.isArray(this.frequency.regions) ? this.frequency.regions : []
      if (this.displayMode === 'continent') {
        return regions
          .filter(item => this.hasCoordinate(item.latitude) && this.hasCoordinate(item.longitude))
          .map(item => ({ ...item, label: item.label, code: item.code }))
      }
      const populations = []
      regions.forEach(region => {
        (region.populations || []).forEach(population => {
          if (!this.hasCoordinate(population.latitude) || !this.hasCoordinate(population.longitude)) return
          populations.push({
            ...population,
            code: population.population,
            label: population.population,
            referenceFrequency: 1 - (Number(population.variantFrequency) || 0),
            sampleCount: Math.floor((Number(population.totalAlleles) || 0) / 2)
          })
        })
      })
      return populations
    },
    hasCoordinate(value) {
      return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
    },
    formatPercent(value) {
      return `${((Number(value) || 0) * 100).toFixed(2)}%`
    },
    formatInteger(value) {
      return Number(value || 0).toLocaleString()
    },
    renderChart() {
      if (!this.chart || !this.frequency) return
      const items = this.displayItems()
      this.chart.setOption({
        series: [
          this.createBoundarySeries(),
          this.createRingSeries(items),
          this.createLabelSeries(items)
        ]
      }, { replaceMerge: ['series'], lazyUpdate: true })
    },
    createBoundarySeries() {
      return {
        id: 'standard-world-boundaries',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        z: 5,
        silent: true,
        progressive: 0,
        data: this.boundaryLines
      }
    },
    createRingSeries(items) {
      const data = []
      const radius = this.displayMode === 'continent' ? 25 : 10
      const innerRadius = this.displayMode === 'continent' ? 15 : 5
      items.forEach(item => {
        const total = Math.max(0, Number(item.totalAlleles) || 0)
        const variant = Math.max(0, Math.min(total, Number(item.variantAlleles) || 0))
        const segments = [
          { name: 'Variant allele', value: variant, color: '#d1495b' },
          { name: 'Reference allele', value: Math.max(0, total - variant), color: '#dbe4ee' }
        ]
        let startAngle = -Math.PI / 2
        segments.forEach(segment => {
          if (segment.value <= 0 || total <= 0) return
          const endAngle = startAngle + (segment.value / total) * Math.PI * 2
          data.push({
            name: segment.name,
            value: [item.longitude, item.latitude, segment.value, startAngle, endAngle],
            segmentValue: segment.value,
            color: segment.color,
            radius,
            innerRadius,
            item
          })
          startAngle = endAngle
        })
      })
      return {
        id: 'frequency-rings',
        name: 'Population frequencies',
        type: 'custom',
        coordinateSystem: 'geo',
        z: 12,
        silent: false,
        progressive: 0,
        clip: false,
        renderItem: (params, api) => {
          const datum = data[params.dataIndex]
          const center = api.coord([api.value(0), api.value(1)])
          if (!center || !Number.isFinite(center[0]) || !Number.isFinite(center[1])) return null
          return {
            type: 'sector',
            shape: {
              cx: center[0],
              cy: center[1],
              r: datum.radius,
              r0: datum.innerRadius,
              startAngle: api.value(3),
              endAngle: api.value(4),
              clockwise: true
            },
            style: {
              fill: datum.color,
              stroke: '#fff',
              lineWidth: this.displayMode === 'continent' ? 1 : 0.7
            },
            emphasis: {
              style: {
                shadowBlur: 14,
                shadowColor: 'rgba(25, 48, 82, 0.35)'
              }
            }
          }
        },
        data
      }
    },
    createLabelSeries(items) {
      let labels = items
      if (this.displayMode === 'population') {
        labels = items
          .filter(item => Number(item.variantAlleles) > 0)
          .sort((left, right) => Number(right.variantFrequency) - Number(left.variantFrequency))
          .slice(0, 14)
      }
      return {
        id: 'frequency-labels',
        name: this.displayMode === 'continent' ? 'Continents' : 'Populations',
        type: 'scatter',
        coordinateSystem: 'geo',
        z: 30,
        silent: true,
        symbolSize: 2,
        itemStyle: { opacity: 0 },
        label: {
          show: true,
          position: 'bottom',
          distance: this.displayMode === 'continent' ? 27 : 11,
          color: '#1f2d3d',
          fontSize: this.displayMode === 'continent' ? 11 : 9,
          fontWeight: 600,
          lineHeight: 14,
          formatter: params => this.displayMode === 'continent'
            ? `${params.data.item.label}\n${this.formatPercent(params.data.item.variantFrequency)}`
            : params.data.item.label
        },
        data: labels.map(item => ({
          name: item.label,
          value: [item.longitude, item.latitude],
          item
        }))
      }
    },
    tooltipContent(params) {
      const item = params.data && params.data.item
      if (!item) return params.name || ''
      const alleleLine = params.seriesType === 'custom' && params.data.segmentValue !== undefined
        ? `<br>${params.name}: ${this.formatInteger(params.data.segmentValue)}`
        : ''
      return [
        `<strong>${item.label}</strong>`,
        `<br>Variant frequency: ${this.formatPercent(item.variantFrequency)}`,
        `<br>Variant alleles: ${this.formatInteger(item.variantAlleles)}`,
        `<br>Total alleles: ${this.formatInteger(item.totalAlleles)}`,
        alleleLine
      ].join('')
    },
    handleRingMouseOver(params) {
      if (!params || params.seriesId !== 'frequency-rings') return
      const datum = params.data || {}
      this.animateRing(params.event && params.event.target, (Number(datum.radius) || 10) + 7)
    },
    handleRingMouseOut(params) {
      if (!params || params.seriesId !== 'frequency-rings') return
      const datum = params.data || {}
      this.animateRing(params.event && params.event.target, Number(datum.radius) || 10)
    },
    animateRing(target, radius) {
      if (!target || !target.shape || !Number.isFinite(target.shape.r)) return
      target.stopAnimation()
      target.animateTo(
        { shape: { ...target.shape, r: radius } },
        { duration: 120, easing: 'cubicOut' }
      )
    },
    hideTooltip() {
      if (this.chart) {
        this.chart.dispatchAction({ type: 'hideTip' })
      }
    },
    handleResize() {
      if (this._resizeFrame) cancelAnimationFrame(this._resizeFrame)
      this._resizeFrame = requestAnimationFrame(() => {
        this._resizeFrame = null
        if (this.chart) this.chart.resize()
      })
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

.frequency-map {
  width: 100%;
  height: 500px;
}

.map-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  color: #64758a;
}

.map-error { color: #a62c3d; }

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
  .map-stage,
  .map-status { min-height: 390px; }
  .frequency-map { height: 390px; }
}
</style>
