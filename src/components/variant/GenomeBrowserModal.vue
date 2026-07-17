<template>
  <div v-if="visible" class="browser-overlay" @mousedown.self="close">
    <section class="browser-dialog" role="dialog" aria-modal="true" aria-labelledby="genome-browser-title">
      <header class="browser-header">
        <div>
          <h2 id="genome-browser-title">Genome browser</h2>
          <p v-if="browser">{{ browser.assembly }} · {{ browser.selectedId }}</p>
        </div>
        <button type="button" class="close-button" aria-label="Close genome browser" @click="close">×</button>
      </header>

      <div class="browser-controls">
        <div class="control-group">
          <span class="control-label">Move</span>
          <button type="button" :disabled="loading" @click="pan(-0.8)">&lt;&lt;</button>
          <button type="button" :disabled="loading" @click="pan(-0.25)">&lt;</button>
          <button type="button" :disabled="loading" @click="pan(0.25)">&gt;</button>
          <button type="button" :disabled="loading" @click="pan(0.8)">&gt;&gt;</button>
        </div>
        <div class="coordinate-search">
          <input
            v-model.trim="coordinateText"
            type="text"
            aria-label="Genome coordinate"
            @keyup.enter="applyCoordinate"
          >
          <button type="button" class="primary-control" :disabled="loading" @click="applyCoordinate">Go</button>
        </div>
        <div class="control-group">
          <span class="control-label">Zoom</span>
          <button type="button" :disabled="loading" @click="zoom(1.5)">1.5×</button>
          <button type="button" :disabled="loading" @click="zoom(3)">3×</button>
          <button type="button" :disabled="loading" @click="zoom(10)">10×</button>
          <button type="button" :disabled="loading" @click="zoom(0.33)">Out</button>
        </div>
      </div>

      <div v-if="error" class="browser-error">{{ error }}</div>
      <div v-if="loading" class="browser-loading"><span></span>Loading genomic tracks…</div>

      <div v-if="browser && !loading" class="browser-canvas-wrap">
        <svg
          class="browser-canvas"
          :viewBox="'0 0 ' + viewWidth + ' ' + svgHeight"
          preserveAspectRatio="xMinYMin meet"
          role="img"
          :aria-label="'Genome tracks for ' + browser.chromosome + ':' + browser.start + '-' + browser.end"
        >
          <rect x="0" y="0" :width="viewWidth" :height="svgHeight" fill="#fff" />

          <g class="ruler">
            <text :x="labelWidth - 14" y="25" text-anchor="end">Position</text>
            <line :x1="labelWidth" y1="30" :x2="labelWidth + plotWidth" y2="30" />
            <g v-for="tick in rulerTicks" :key="tick.value">
              <line :x1="tick.x" y1="24" :x2="tick.x" :y2="svgHeight" class="grid-line" />
              <text :x="tick.x" y="18" text-anchor="middle">{{ formatCoordinate(tick.value) }}</text>
            </g>
          </g>

          <g
            v-for="(track, trackIndex) in browser.tracks"
            :key="track.id"
            :transform="'translate(0 ' + trackTop(trackIndex) + ')'"
            class="track"
          >
            <rect x="0" y="0" :width="viewWidth" :height="trackHeight" :class="trackIndex % 2 ? 'track-alt' : 'track-base'" />
            <text :x="labelWidth - 14" y="25" text-anchor="end" class="track-label">{{ track.label }}</text>
            <line :x1="labelWidth" :y1="trackHeight - 12" :x2="labelWidth + plotWidth" :y2="trackHeight - 12" class="track-axis" />

            <template v-for="(feature, featureIndex) in track.features">
              <g v-if="track.kind === 'signal'" :key="track.id + '-' + feature.id + '-' + featureIndex">
                <rect
                  :x="featureX(feature)"
                  :y="signalY(track, feature)"
                  :width="Math.max(2, featureWidth(feature))"
                  :height="signalHeight(track, feature)"
                  :fill="featureColor(feature.type, track.id)"
                  class="signal-feature"
                >
                  <title>{{ featureTooltip(feature) }}</title>
                </rect>
              </g>
              <g v-else :key="track.id + '-' + feature.id + '-' + featureIndex">
                <rect
                  :x="featureX(feature)"
                  :y="intervalY(featureIndex)"
                  :width="Math.max(3, featureWidth(feature))"
                  height="13"
                  rx="2"
                  :fill="featureColor(feature.type, track.id)"
                  :class="{ 'selected-feature': track.id === 'selected' }"
                >
                  <title>{{ featureTooltip(feature) }}</title>
                </rect>
                <text
                  v-if="track.id === 'selected'"
                  :x="Math.min(labelWidth + plotWidth - 8, featureX(feature) + 5)"
                  :y="intervalY(featureIndex) - 3"
                  class="feature-label"
                >{{ feature.label }}</text>
              </g>
            </template>
          </g>
        </svg>
      </div>

      <footer class="browser-footer">
        <div class="type-legend">
          <span><i class="del"></i>DEL</span>
          <span><i class="dup"></i>DUP</span>
          <span><i class="ins"></i>INS / SNP</span>
          <span><i class="inv"></i>INV</span>
        </div>
        <span v-if="browser">{{ formatInteger(browser.end - browser.start + 1) }} bp</span>
      </footer>
    </section>
  </div>
</template>

<script>
import { getSnpBrowser, getSvBrowser } from '@/api/variant'

export default {
  name: 'GenomeBrowserModal',
  props: {
    visible: { type: Boolean, default: false },
    kind: { type: String, required: true },
    variant: { type: Object, default: null }
  },
  data() {
    return {
      browser: null,
      loading: false,
      error: '',
      coordinateText: '',
      viewWidth: 1280,
      labelWidth: 190,
      plotWidth: 1060,
      trackHeight: 78,
      previousBodyOverflow: ''
    }
  },
  computed: {
    svgHeight() {
      return 52 + ((this.browser && this.browser.tracks.length) || 0) * this.trackHeight
    },
    rulerTicks() {
      if (!this.browser) return []
      const count = 6
      const span = this.browser.end - this.browser.start
      return Array.from({ length: count }, (_, index) => {
        const ratio = index / (count - 1)
        return {
          value: Math.round(this.browser.start + span * ratio),
          x: this.labelWidth + this.plotWidth * ratio
        }
      })
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', this.handleKeydown)
        this.loadBrowser()
      } else {
        document.body.style.overflow = this.previousBodyOverflow
        document.removeEventListener('keydown', this.handleKeydown)
      }
    },
    variant() {
      if (this.visible) this.loadBrowser()
    }
  },
  beforeDestroy() {
    document.body.style.overflow = this.previousBodyOverflow
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    async loadBrowser(range = null) {
      if (!this.variant || this.loading) return
      this.loading = true
      this.error = ''
      try {
        const id = this.kind === 'snp' ? (this.variant.rsId || this.variant.id) : this.variant.id
        const params = {
          id,
          chromosome: this.variant.chromosome
        }
        if (range) {
          params.start = range.start
          params.end = range.end
        }
        const response = this.kind === 'snp'
          ? await getSnpBrowser(params)
          : await getSvBrowser(params)
        this.browser = response.data
        this.coordinateText = this.browser.chromosome + ':' + this.browser.start + '-' + this.browser.end
      } catch (error) {
        this.error = (error.response && error.response.data && error.response.data.message) || 'Unable to load genomic tracks.'
      } finally {
        this.loading = false
      }
    },
    pan(fraction) {
      if (!this.browser) return
      const span = this.browser.end - this.browser.start + 1
      const shift = Math.round(span * fraction)
      let start = this.browser.start + shift
      let end = this.browser.end + shift
      if (start < 1) {
        end += 1 - start
        start = 1
      }
      this.loadBrowser({ start, end })
    },
    zoom(factor) {
      if (!this.browser) return
      const center = Math.round((this.browser.start + this.browser.end) / 2)
      const currentSpan = this.browser.end - this.browser.start + 1
      const nextSpan = Math.max(100, Math.min(10000000, Math.round(currentSpan / factor)))
      const start = Math.max(1, center - Math.floor(nextSpan / 2))
      const end = start + nextSpan - 1
      this.loadBrowser({ start, end })
    },
    applyCoordinate() {
      const match = this.coordinateText.match(/^(chr(?:[1-9]|1[0-9]|2[0-2]|X|Y|M)):\s*([\d,]+)\s*-\s*([\d,]+)$/i)
      if (!match) {
        this.error = 'Enter a coordinate such as chr21:5,000,000-5,200,000.'
        return
      }
      const chromosome = match[1].toLowerCase()
      if (!this.browser || chromosome !== this.browser.chromosome.toLowerCase()) {
        this.error = 'This view is anchored to ' + (this.browser ? this.browser.chromosome : 'the selected chromosome') + '.'
        return
      }
      const start = Number(match[2].replace(/,/g, ''))
      const end = Number(match[3].replace(/,/g, ''))
      if (start < 1 || end < start || end - start + 1 > 10000000) {
        this.error = 'Coordinate range must be valid and no larger than 10 Mb.'
        return
      }
      this.loadBrowser({ start, end })
    },
    trackTop(index) {
      return 48 + index * this.trackHeight
    },
    featureX(feature) {
      if (!this.browser) return this.labelWidth
      const start = Math.max(this.browser.start, Math.min(this.browser.end, feature.start))
      return this.labelWidth + ((start - this.browser.start) / (this.browser.end - this.browser.start + 1)) * this.plotWidth
    },
    featureWidth(feature) {
      if (!this.browser) return 2
      const start = Math.max(this.browser.start, feature.start)
      const end = Math.min(this.browser.end, Math.max(feature.start + 1, feature.end))
      return Math.max(2, ((end - start) / (this.browser.end - this.browser.start + 1)) * this.plotWidth)
    },
    intervalY(index) {
      return 17 + (index % 3) * 16
    },
    trackMaximum(track) {
      const values = track.features.map(feature => Number(feature.value) || 0)
      return Math.max(1, ...values)
    },
    signalHeight(track, feature) {
      return Math.max(2, ((Number(feature.value) || 0) / this.trackMaximum(track)) * 48)
    },
    signalY(track, feature) {
      return this.trackHeight - 12 - this.signalHeight(track, feature)
    },
    featureColor(type, trackId) {
      if (trackId === 'frequency') return '#3d7fb4'
      if (trackId === 'allele-count') return '#6574a8'
      if (trackId === 'novelty') return '#aa6f34'
      const colors = {
        DEL: '#d64545',
        DUP: '#2f9d69',
        INS: '#2779bd',
        SNP: '#2779bd',
        INV: '#7a55a3',
        BND: '#d17a22'
      }
      return colors[String(type || '').toUpperCase()] || '#536b86'
    },
    featureTooltip(feature) {
      const lines = [
        feature.label,
        this.browser.chromosome + ':' + this.formatInteger(feature.start) + '-' + this.formatInteger(feature.end)
      ]
      if (feature.value !== null && feature.value !== undefined) lines.push('Value: ' + Number(feature.value).toPrecision(5))
      Object.entries(feature.details || {}).forEach(([key, value]) => lines.push(key + ': ' + value))
      return lines.join('\n')
    },
    formatCoordinate(value) {
      if (value >= 1000000) return (value / 1000000).toFixed(2) + ' Mb'
      if (value >= 1000) return (value / 1000).toFixed(1) + ' kb'
      return value + ' bp'
    },
    formatInteger(value) {
      return Number(value || 0).toLocaleString()
    },
    handleKeydown(event) {
      if (event.key === 'Escape') this.close()
    },
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.browser-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vh 2vw;
  background: rgba(16, 27, 44, 0.72);
}

.browser-dialog {
  display: flex;
  flex-direction: column;
  width: 96vw;
  max-width: 1580px;
  height: 94vh;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.32);
}

.browser-header,
.browser-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  border-bottom: 1px solid #dbe2eb;
}

.browser-header h2 { margin: 0; color: #20385f; font-size: 1.35rem; }
.browser-header p { margin: 3px 0 0; color: #68788c; font-size: 0.85rem; }

.close-button {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: #e7edf4;
  color: #263c5c;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
}

.browser-controls {
  display: grid;
  grid-template-columns: auto minmax(320px, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 12px 22px;
  background: #f4f7fa;
  border-bottom: 1px solid #dbe2eb;
}

.control-group,
.coordinate-search { display: flex; align-items: center; gap: 5px; }
.control-label { margin-right: 4px; color: #5e6e82; font-size: 0.82rem; font-weight: 700; }
.browser-controls button {
  min-width: 38px;
  height: 34px;
  border: 1px solid #aebccd;
  border-radius: 5px;
  background: #fff;
  color: #263e62;
  font-weight: 600;
  cursor: pointer;
}
.browser-controls button:hover:not(:disabled) { border-color: #315f93; background: #eaf1f8; }
.browser-controls button:disabled { opacity: 0.45; cursor: not-allowed; }
.coordinate-search input {
  width: 100%;
  height: 36px;
  padding: 0 11px;
  border: 1px solid #aebccd;
  border-radius: 5px;
  font: inherit;
}
.browser-controls .primary-control { min-width: 58px; background: #294f7d; border-color: #294f7d; color: #fff; }

.browser-error { margin: 12px 22px 0; padding: 10px 13px; border-radius: 5px; background: #fff0f1; color: #a62c3d; }
.browser-loading { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; color: #607287; }
.browser-loading span { width: 20px; height: 20px; border: 3px solid #d8e1eb; border-top-color: #315f93; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.browser-canvas-wrap { flex: 1; overflow: auto; padding: 12px 18px; background: #eef2f6; }
.browser-canvas { display: block; width: 100%; min-width: 980px; height: auto; border: 1px solid #cbd5e0; background: #fff; }
.ruler text { fill: #45576d; font-size: 11px; }
.ruler > line,
.track-axis { stroke: #61748a; stroke-width: 1; }
.grid-line { stroke: #dbe5ef; stroke-width: 1; }
.track-base { fill: #fff; }
.track-alt { fill: #f8fafc; }
.track-label { fill: #263d5f; font-size: 12px; font-weight: 700; }
.signal-feature,
.track rect:not(.track-base):not(.track-alt) { transition: opacity 0.15s ease; }
.signal-feature:hover,
.track rect:not(.track-base):not(.track-alt):hover { opacity: 0.7; stroke: #142a46; stroke-width: 1.2; }
.selected-feature { stroke: #101f35; stroke-width: 2; }
.feature-label { fill: #172c49; font-size: 10px; font-weight: 700; }

.browser-footer { border-top: 1px solid #dbe2eb; border-bottom: 0; color: #65758a; font-size: 0.82rem; }
.type-legend { display: flex; flex-wrap: wrap; gap: 18px; }
.type-legend span { display: inline-flex; align-items: center; gap: 6px; }
.type-legend i { width: 12px; height: 8px; border-radius: 2px; }
.type-legend .del { background: #d64545; }
.type-legend .dup { background: #2f9d69; }
.type-legend .ins { background: #2779bd; }
.type-legend .inv { background: #7a55a3; }

@media (max-width: 980px) {
  .browser-controls { grid-template-columns: 1fr; }
  .control-group { justify-content: center; }
}
</style>
