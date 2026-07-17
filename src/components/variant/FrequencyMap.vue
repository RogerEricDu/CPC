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
      chart: null,
      renderFrame: null
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
    this.chart.on('georoam', this.scheduleRingRender)
    window.addEventListener('resize', this.handleResize)
    this.renderChart()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.renderFrame) cancelAnimationFrame(this.renderFrame)
    if (this.chart) {
      this.chart.off('georoam', this.scheduleRingRender)
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
      this.chart.setOption({
        animationDuration: 350,
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
        series: []
      }, true)
      this.scheduleRingRender()
    },
    scheduleRingRender() {
      if (this.renderFrame) cancelAnimationFrame(this.renderFrame)
      this.renderFrame = requestAnimationFrame(() => {
        this.renderFrame = null
        this.renderRings()
      })
    },
    renderRings() {
      if (!this.chart) return
      const regions = this.frequency.regions || []
      const pies = regions.map((region, index) => {
        const center = this.chart.convertToPixel({ geoIndex: 0 }, [region.longitude, region.latitude])
        return {
          id: `frequency-ring-${region.code}`,
          name: region.label,
          type: 'pie',
          center,
          radius: [15, 25],
          z: 12 + index,
          silent: false,
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            itemStyle: {
              shadowBlur: 14,
              shadowColor: 'rgba(25, 48, 82, 0.35)'
            }
          },
          data: [
            {
              name: 'Variant allele',
              value: region.variantAlleles,
              region,
              itemStyle: { color: '#d1495b', borderColor: '#fff', borderWidth: 1 }
            },
            {
              name: 'Reference allele',
              value: Math.max(0, region.totalAlleles - region.variantAlleles),
              region,
              itemStyle: { color: '#dbe4ee', borderColor: '#fff', borderWidth: 1 }
            }
          ]
        }
      })
      const labels = {
        id: 'frequency-region-labels',
        name: 'Regions',
        type: 'scatter',
        coordinateSystem: 'geo',
        z: 30,
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
      this.chart.setOption({ series: [...pies, labels] }, { replaceMerge: ['series'], lazyUpdate: true })
    },
    tooltipContent(params) {
      const region = params.data && params.data.region
      if (!region) return params.name || ''
      const alleleLine = params.seriesType === 'pie'
        ? `<br>${params.name}: ${this.formatInteger(params.value)}`
        : ''
      return [
        `<strong>${region.label}</strong>`,
        `<br>Variant frequency: ${this.formatPercent(region.variantFrequency)}`,
        `<br>Variant alleles: ${this.formatInteger(region.variantAlleles)}`,
        `<br>Total alleles: ${this.formatInteger(region.totalAlleles)}`,
        alleleLine
      ].join('')
    },
    handleResize() {
      if (!this.chart) return
      this.chart.resize()
      this.scheduleRingRender()
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
