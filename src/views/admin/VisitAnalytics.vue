<template>
  <section class="analytics-panel">
    <div class="analytics-toolbar">
      <div>
        <h2>Visit Analytics</h2>
        <p>IP-based page-view records and geographic distribution. Analytics data is visible only to administrators.</p>
      </div>
      <label>
        Reporting period
        <select v-model.number="days" @change="load">
          <option :value="7">Last 7 days</option>
          <option :value="30">Last 30 days</option>
          <option :value="90">Last 90 days</option>
          <option :value="365">Last 12 months</option>
        </select>
      </label>
    </div>

    <p v-if="error" class="analytics-error">{{ error }}</p>

    <div class="metric-grid">
      <article><span>Total page views</span><strong>{{ summary.totalVisits || 0 }}</strong></article>
      <article><span>Unique visitors</span><strong>{{ summary.uniqueVisitors || 0 }}</strong></article>
      <article><span>Today</span><strong>{{ summary.todayVisits || 0 }}</strong></article>
      <article><span>Last 7 days</span><strong>{{ summary.weekVisits || 0 }}</strong></article>
      <article><span>Last 30 days</span><strong>{{ summary.monthVisits || 0 }}</strong></article>
    </div>

    <div class="chart-grid">
      <article class="chart-card">
        <header>
          <h3>Weekly visits</h3>
          <span>Daily page views and unique visitors</span>
        </header>
        <div ref="weeklyChart" class="trend-chart"></div>
      </article>
      <article class="chart-card">
        <header>
          <h3>Monthly visits</h3>
          <span>Last 30 days</span>
        </header>
        <div ref="monthlyChart" class="trend-chart"></div>
      </article>
    </div>

    <article class="chart-card map-card">
      <header>
        <div>
          <h3>Global visit distribution</h3>
          <span>Hover for totals; drag to pan and use the mouse wheel to zoom.</span>
        </div>
        <span class="map-source">China boundary source: Alibaba Cloud DataV / AMap</span>
      </header>
      <div ref="worldMap" class="world-map"></div>
    </article>

    <article class="records-card">
      <header>
        <div>
          <h3>Visit records</h3>
          <span>{{ records.total || 0 }} recorded page views</span>
        </div>
      </header>
      <div class="records-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>IP address</th>
              <th>Country / region</th>
              <th>Page</th>
              <th>Visitor</th>
              <th>Environment</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in records.items" :key="item.id">
              <td>{{ item.visitedAt }}</td>
              <td class="mono">{{ item.ipAddress }}</td>
              <td>{{ item.countryName || 'Unknown' }} <small>{{ item.countryCode }}</small></td>
              <td><strong>{{ item.title || '-' }}</strong><small>{{ item.path }}</small></td>
              <td class="mono">{{ shortVisitor(item.visitorId) }}</td>
              <td>
                <span>{{ item.language || '-' }} · {{ item.timezone || '-' }}</span>
                <small>{{ item.screenSize || '-' }}</small>
              </td>
            </tr>
            <tr v-if="!records.items || records.items.length === 0">
              <td colspan="6" class="empty-records">No visits recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="records-pager">
        <button :disabled="records.page <= 1" @click="changePage(records.page - 1)">Previous</button>
        <span>Page {{ records.page || 1 }} of {{ pageCount }}</span>
        <button :disabled="records.page >= pageCount" @click="changePage(records.page + 1)">Next</button>
      </div>
    </article>
  </section>
</template>

<script>
import * as echarts from 'echarts'
import worldMap from '@/assets/maps/world-cpc.json'
import { getVisitAnalytics } from '@/api/visits'

const MAP_NAME = 'cpc-world'
let mapRegistered = false

export default {
  name: 'VisitAnalytics',
  data() {
    return {
      days: 30,
      page: 1,
      size: 25,
      summary: {},
      daily: [],
      countries: [],
      records: { items: [], total: 0, page: 1, size: 25 },
      error: '',
      charts: []
    }
  },
  computed: {
    pageCount() {
      return Math.max(1, Math.ceil((this.records.total || 0) / this.size))
    }
  },
  mounted() {
    if (!mapRegistered) {
      echarts.registerMap(MAP_NAME, worldMap)
      mapRegistered = true
    }
    window.addEventListener('resize', this.resizeCharts)
    this.load()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCharts)
    this.charts.forEach(chart => chart.dispose())
  },
  methods: {
    async load() {
      this.error = ''
      try {
        const response = await getVisitAnalytics({
          days: this.days,
          page: this.page,
          size: this.size
        })
        this.summary = response.data.summary || {}
        this.daily = response.data.daily || []
        this.countries = response.data.countries || []
        this.records = response.data.records || { items: [], total: 0, page: 1, size: this.size }
        this.$nextTick(this.renderCharts)
      } catch (error) {
        this.error = error.message || 'Failed to load visit analytics.'
      }
    },
    refresh() {
      return this.load()
    },
    changePage(page) {
      this.page = page
      this.load()
    },
    shortVisitor(value) {
      if (!value) return '-'
      return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value
    },
    renderCharts() {
      this.charts.forEach(chart => chart.dispose())
      const weekly = echarts.init(this.$refs.weeklyChart)
      const monthly = echarts.init(this.$refs.monthlyChart)
      const world = echarts.init(this.$refs.worldMap)
      this.charts = [weekly, monthly, world]
      weekly.setOption(this.trendOption(this.daily.slice(-7)))
      monthly.setOption(this.trendOption(this.daily.slice(-30)))
      world.setOption(this.mapOption())
    },
    trendOption(items) {
      return {
        animationDuration: 500,
        color: ['#315aa8', '#177245'],
        tooltip: { trigger: 'axis' },
        legend: { data: ['Page views', 'Unique visitors'], bottom: 0 },
        grid: { left: 46, right: 20, top: 24, bottom: 52 },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: items.map(item => item.date.slice(5)),
          axisLabel: { color: '#667085' }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: '#667085' },
          splitLine: { lineStyle: { color: '#edf0f5' } }
        },
        series: [
          {
            name: 'Page views',
            type: 'line',
            smooth: true,
            symbolSize: 7,
            areaStyle: { opacity: 0.12 },
            data: items.map(item => item.visits)
          },
          {
            name: 'Unique visitors',
            type: 'line',
            smooth: true,
            symbolSize: 7,
            data: items.map(item => item.uniqueVisitors)
          }
        ]
      }
    },
    mapOption() {
      const nameByCode = {}
      const uniqueByCode = {}
      const data = this.countries
        .filter(item => item.countryCode && !['UNKNOWN', 'LOCAL'].includes(item.countryCode))
        .map(item => {
          nameByCode[item.countryCode] = item.countryName
          uniqueByCode[item.countryCode] = item.uniqueVisitors
          return { name: item.countryCode, value: item.visits }
        })
      const maximum = Math.max(1, ...data.map(item => item.value))
      return {
        animationDurationUpdate: 600,
        tooltip: {
          trigger: 'item',
          formatter: params => {
            const countryName = nameByCode[params.name]
              || (params.data && params.data.countryName)
              || params.name
            const visits = Number.isFinite(params.value) ? params.value : 0
            return `${countryName}<br>Page views: ${visits}<br>Unique visitors: ${uniqueByCode[params.name] || 0}`
          }
        },
        visualMap: {
          min: 0,
          max: maximum,
          left: 18,
          bottom: 18,
          text: ['More visits', 'Fewer'],
          calculable: true,
          inRange: { color: ['#edf3ff', '#9bb5e6', '#315aa8', '#17366e'] }
        },
        series: [{
          type: 'map',
          map: MAP_NAME,
          roam: true,
          zoom: 1.08,
          scaleLimit: { min: 1, max: 8 },
          selectedMode: false,
          data,
          itemStyle: {
            areaColor: '#eef2f7',
            borderColor: '#6b7280',
            borderWidth: 0.65
          },
          emphasis: {
            label: { show: false },
            itemStyle: {
              areaColor: '#ffb24d',
              borderColor: '#1f2937',
              borderWidth: 1
            }
          }
        }]
      }
    },
    resizeCharts() {
      this.charts.forEach(chart => chart.resize())
    }
  }
}
</script>

<style scoped>
.analytics-panel {
  display: grid;
  gap: 18px;
}

.analytics-toolbar,
.chart-card header,
.records-card header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.analytics-toolbar {
  padding: 18px;
  border: 1px solid #e1e6ef;
  border-radius: 8px;
  background: #f8fafc;
}

.analytics-toolbar h2,
.chart-card h3,
.records-card h3 {
  margin: 0 0 5px;
  color: #243b6b;
  line-height: 1.25;
}

.analytics-toolbar h2 {
  height: auto;
  padding: 0;
  background: transparent;
  font-size: 1.35rem;
}

.analytics-toolbar h2::before {
  display: none;
}

.analytics-toolbar p,
.chart-card header span,
.records-card header span {
  color: #667085;
  font-size: 0.88rem;
}

.analytics-toolbar label {
  display: grid;
  gap: 6px;
  color: #475467;
  font-size: 0.82rem;
  font-weight: 700;
}

.analytics-toolbar select {
  min-width: 165px;
  height: 38px;
  border: 1px solid #cfd6e2;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.metric-grid article,
.chart-card,
.records-card {
  border: 1px solid #e1e6ef;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.metric-grid article {
  padding: 16px;
}

.metric-grid span {
  display: block;
  color: #667085;
  font-size: 0.82rem;
}

.metric-grid strong {
  display: block;
  margin-top: 9px;
  color: #1f3d77;
  font-size: 1.75rem;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.chart-card header,
.records-card header {
  padding: 16px 18px 0;
}

.trend-chart {
  height: 300px;
}

.world-map {
  height: 540px;
}

.map-card header {
  align-items: center;
}

.map-source {
  max-width: 330px;
  text-align: right;
}

.records-wrap {
  margin-top: 14px;
  overflow-x: auto;
  border-top: 1px solid #e1e6ef;
  border-bottom: 1px solid #e1e6ef;
}

table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 11px 12px;
  border-bottom: 1px solid #e8ebf1;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

th {
  background: #f7f9fc;
  color: #344054;
}

th:nth-child(1) { width: 155px; }
th:nth-child(2) { width: 135px; }
th:nth-child(3) { width: 155px; }
th:nth-child(4) { width: 290px; }
th:nth-child(5) { width: 165px; }
th:nth-child(6) { width: 240px; }

td small {
  display: block;
  margin-top: 4px;
  color: #8a94a6;
}

.mono {
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.83rem;
}

.records-pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  padding: 14px;
}

.records-pager button {
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid #9aa8bc;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-weight: 700;
}

.records-pager button:disabled {
  border-color: #d7dce5;
  background: #e7eaf0;
  color: #9ca3af;
  cursor: not-allowed;
}

.empty-records,
.analytics-error {
  padding: 20px;
  color: #b42318;
  text-align: center;
}

@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }

  .analytics-toolbar {
    flex-direction: column;
  }

  .world-map {
    height: 420px;
  }
}
</style>
