<template>
  <section class="frequency-panel">
    <div class="panel-heading">
      <div>
        <h3>Population frequency distribution</h3>
        <p>{{ frequency.variantId }} · {{ frequency.assembly }}</p>
      </div>
      <div class="global-frequency">
        <strong>{{ formatPercent(frequency.globalFrequency) }}</strong>
        <span>{{ formatInteger(frequency.variantAlleles) }} / {{ formatInteger(frequency.totalAlleles) }} alleles</span>
      </div>
    </div>
    <div ref="chart" class="frequency-map" role="img" :aria-label="`Population frequency map for ${frequency.variantId}`"></div>
    <div class="frequency-legend" aria-hidden="true">
      <span><i class="variant-swatch"></i>Variant allele</span>
      <span><i class="reference-swatch"></i>Reference allele</span>
    </div>
  </section>
</template>

<script>
import * as echarts from 'echarts'
import worldMap from '@/assets/maps/world-cpc.json'

const MAP_NAME = 'cpc-variant-frequency-world'
let mapRegistered = false

export default {
  name: 'FrequencyMap',
  props: {
    frequency: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    frequency: {
      deep: true,
      handler() {
        this.renderChart()
      }
    }
  },
  mounted() {
    if (!mapRegistered) {
      echarts.registerMap(MAP_NAME, worldMap)
      mapRegistered = true
    }
    this.chart = echarts.init(this.$refs.chart)
    this.chart.on('mouseover', this.handleRingMouseOver)
    this.chart.on('mouseout', this.handleRingMouseOut)
    window.addEventListener('resize', this.handleResize)
    this.renderChart()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.off('mouseover', this.handleRingMouseOver)
      this.chart.off('mouseout', this.handleRingMouseOut)
      this.chart.dispose()
    }
  },
  methods: {
    formatPercent(value) {
      return `${((Number(value) || 0) * 100).toFixed(2)}%`
    },
    formatInteger(value) {
      return Number(value || 0).toLocaleString()
    },
    renderChart() {
      if (!this.chart || !this.frequency || !Array.isArray(this.frequency.regions)) return
      const regions = this.frequency.regions
      this.chart.setOption({
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
          roam: true,
          center: [15, 24],
          zoom: 1.08,
          scaleLimit: { min: 0.8, max: 7 },
          itemStyle: {
            areaColor: '#e9eef5',
            borderColor: '#8795a8',
            borderWidth: 0.7
          },
          emphasis: {
            itemStyle: { areaColor: '#dce6f2' },
            label: { show: false }
          },
          select: { disabled: true }
        },
        series: [
          this.createRingSeries(regions),
          this.createLabelSeries(regions)
        ]
      }, true)
    },
    createRingSeries(regions) {
      const data = []
      regions.forEach(region => {
        const total = Math.max(0, Number(region.totalAlleles) || 0)
        const variant = Math.max(0, Math.min(total, Number(region.variantAlleles) || 0))
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
            value: [region.longitude, region.latitude, segment.value, startAngle, endAngle],
            segmentValue: segment.value,
            color: segment.color,
            region
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
          const item = data[params.dataIndex]
          const center = api.coord([api.value(0), api.value(1)])
          if (!center || !Number.isFinite(center[0]) || !Number.isFinite(center[1])) return null
          return {
            type: 'sector',
            shape: {
              cx: center[0],
              cy: center[1],
              r: 25,
              r0: 15,
              startAngle: api.value(3),
              endAngle: api.value(4),
              clockwise: true
            },
            style: {
              fill: item.color,
              stroke: '#fff',
              lineWidth: 1
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
    createLabelSeries(regions) {
      return {
        id: 'frequency-region-labels',
        name: 'Regions',
        type: 'scatter',
        coordinateSystem: 'geo',
        z: 30,
        silent: true,
        symbolSize: 2,
        itemStyle: { opacity: 0 },
        label: {
          show: true,
          position: 'bottom',
          distance: 27,
          color: '#1f2d3d',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 15,
          formatter: params => `${params.data.region.label}\n${this.formatPercent(params.data.region.variantFrequency)}`
        },
        data: regions.map(region => ({
          name: region.label,
          value: [region.longitude, region.latitude],
          region
        }))
      }
    },
    tooltipContent(params) {
      const region = params.data && params.data.region
      if (!region) return params.name || ''
      const alleleLine = params.seriesType === 'custom' && params.data.segmentValue !== undefined
        ? `<br>${params.name}: ${this.formatInteger(params.data.segmentValue)}`
        : ''
      return [
        `<strong>${region.label}</strong>`,
        `<br>Variant frequency: ${this.formatPercent(region.variantFrequency)}`,
        `<br>Variant alleles: ${this.formatInteger(region.variantAlleles)}`,
        `<br>Total alleles: ${this.formatInteger(region.totalAlleles)}`,
        alleleLine
      ].join('')
    },
    handleRingMouseOver(params) {
      if (!params || params.seriesId !== 'frequency-rings') return
      this.animateRing(params.event && params.event.target, 33)
    },
    handleRingMouseOut(params) {
      if (!params || params.seriesId !== 'frequency-rings') return
      this.animateRing(params.event && params.event.target, 25)
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
      if (!this.chart) return
      this.chart.resize()
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

.frequency-map {
  width: 100%;
  height: 500px;
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

@media (max-width: 760px) {
  .panel-heading { flex-direction: column; }
  .global-frequency { align-items: flex-start; }
  .frequency-map { height: 390px; }
}
</style>
