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

      <div v-if="error" class="browser-error">{{ error }}</div>
      <div v-if="loading" class="browser-loading"><span></span>Loading genomic tracks...</div>
      <div v-show="browser && !loading && !error" ref="jbrowse" class="jbrowse-container"></div>
    </section>
  </div>
</template>

<script>
import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view2'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { getSnpBrowser, getSvBrowser } from '@/api/variant'

const CHROMOSOME_LENGTHS = {
  GRCh38: {
    chr1: 248956422, chr2: 242193529, chr3: 198295559, chr4: 190214555,
    chr5: 181538259, chr6: 170805979, chr7: 159345973, chr8: 145138636,
    chr9: 138394717, chr10: 133797422, chr11: 135086622, chr12: 133275309,
    chr13: 114364328, chr14: 107043718, chr15: 101991189, chr16: 90338345,
    chr17: 83257441, chr18: 80373285, chr19: 58617616, chr20: 64444167,
    chr21: 46709983, chr22: 50818468, chrX: 156040895, chrY: 57227415, chrM: 16569
  },
  'CHM13v2.0': {
    chr1: 248387328, chr2: 242696752, chr3: 201105948, chr4: 193574945,
    chr5: 182045439, chr6: 172126628, chr7: 160567428, chr8: 146259331,
    chr9: 150617247, chr10: 134758134, chr11: 135127769, chr12: 133324548,
    chr13: 113566686, chr14: 101161492, chr15: 99753195, chr16: 96330374,
    chr17: 84276897, chr18: 80542538, chr19: 61707364, chr20: 66210255,
    chr21: 45090682, chr22: 51324926, chrX: 154259566, chrY: 62460029, chrM: 16569
  }
}

export default {
  name: 'GenomeBrowserModal',
  props: {
    visible: { type: Boolean, default: false },
    kind: { type: String, required: true },
    variant: { type: Object, default: null }
  },
  beforeCreate() {
    this._jbrowseReactRoot = null
    this._jbrowseViewState = null
  },
  data() {
    return {
      browser: null,
      loading: false,
      error: '',
      loadRequestId: 0,
      previousBodyOverflow: ''
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        document.body.classList.add('cpc-genome-browser-open')
        document.addEventListener('keydown', this.handleKeydown)
        this.loadBrowser()
      } else {
        this.loadRequestId++
        document.body.style.overflow = this.previousBodyOverflow
        document.body.classList.remove('cpc-genome-browser-open')
        document.removeEventListener('keydown', this.handleKeydown)
        this.cleanupJBrowse()
      }
    },
    variant() {
      if (this.visible) this.loadBrowser()
    }
  },
  beforeDestroy() {
    this.loadRequestId++
    document.body.style.overflow = this.previousBodyOverflow
    document.body.classList.remove('cpc-genome-browser-open')
    document.removeEventListener('keydown', this.handleKeydown)
    this.cleanupJBrowse()
  },
  methods: {
    async loadBrowser() {
      if (!this.variant) return
      const requestId = ++this.loadRequestId
      this.cleanupJBrowse()
      this.browser = null
      this.loading = true
      this.error = ''
      try {
        const id = this.kind === 'snp' ? (this.variant.rsId || this.variant.id) : this.variant.id
        const params = { id, chromosome: this.variant.chromosome }
        const response = this.kind === 'snp'
          ? await getSnpBrowser(params)
          : await getSvBrowser(params)
        if (requestId !== this.loadRequestId || !this.visible) return
        this.browser = response.data
        this.loading = false
        await this.$nextTick()
        if (requestId !== this.loadRequestId || !this.visible) return
        this.renderJBrowse()
      } catch (error) {
        if (requestId !== this.loadRequestId) return
        this.cleanupJBrowse()
        this.browser = null
        this.error = (error.response && error.response.data && error.response.data.message) || error.message || 'Unable to load genomic tracks.'
      } finally {
        if (requestId === this.loadRequestId) this.loading = false
      }
    },
    renderJBrowse() {
      const container = this.$refs.jbrowse
      if (!container || !this.browser) return
      this._jbrowseViewState = createViewState(this.createJBrowseOptions(this.browser))
      this._jbrowseReactRoot = ReactDOM.createRoot(container)
      this._jbrowseReactRoot.render(React.createElement(JBrowseLinearGenomeView, { viewState: this._jbrowseViewState }))
    },
    createJBrowseOptions(browser) {
      const key = this.safeId(`${this.kind}-${browser.selectedId}`)
      const assemblyName = browser.assembly
      const referenceTrackId = `${key}-reference`
      const assemblyLengths = CHROMOSOME_LENGTHS[assemblyName] || {
        [browser.chromosome]: Math.max(browser.end + 1000000, 1000000)
      }
      const chromSizes = Object.entries(assemblyLengths)
        .map(([chromosome, length]) => `${chromosome}\t${length}`)
        .join('\n') + '\n'
      const chromSizesUri = `data:text/plain;charset=utf-8,${encodeURIComponent(chromSizes)}`
      const tracks = browser.tracks.map(track => this.createTrackConfig(track, browser, assemblyName, key))
      const sessionTracks = tracks.map(track => ({
        type: track.type,
        configuration: track.trackId,
        displays: track.displays.map(display => ({
          type: display.type,
          configuration: display.displayId
        }))
      }))

      const assembly = {
        name: assemblyName,
        aliases: assemblyName === 'GRCh38' ? ['hg38'] : ['hs1', 'T2T-CHM13v2.0'],
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: referenceTrackId,
          adapter: {
            type: 'ChromSizesAdapter',
            chromSizesLocation: {
              uri: chromSizesUri,
              locationType: 'UriLocation'
            }
          }
        }
      }

      return {
        assembly,
        tracks,
        location: `${browser.chromosome}:${browser.start}..${browser.end}`,
        disableAddTracks: true,
        configuration: {
          theme: {
            palette: {
              primary: { main: '#315f93' },
              secondary: { main: '#72558d' }
            },
            typography: { fontSize: 13 },
            zIndex: {
              drawer: 5000,
              modal: 5100,
              snackbar: 5200,
              tooltip: 5300
            }
          }
        },
        defaultSession: {
          name: `${browser.selectedId} genome view`,
          view: {
            id: `${key}-linear-view`,
            type: 'LinearGenomeView',
            tracks: sessionTracks,
            showCenterLine: true,
            showGridlines: true,
            trackLabels: 'offset'
          }
        }
      }
    },
    createTrackConfig(track, browser, assemblyName, key) {
      const trackId = `${key}-${this.safeId(track.id)}`
      const quantitative = track.kind === 'signal'
      const displayType = quantitative ? 'LinearWiggleDisplay' : 'LinearBasicDisplay'
      return {
        type: quantitative ? 'QuantitativeTrack' : 'FeatureTrack',
        trackId,
        name: track.label,
        category: ['CPC variant data'],
        assemblyNames: [assemblyName],
        adapter: {
          type: 'FromConfigAdapter',
          adapterId: `${trackId}-adapter`,
          features: track.features.map((feature, index) => this.createFeature(feature, browser, trackId, index))
        },
        displays: [
          {
            type: displayType,
            displayId: `${trackId}-${displayType}`
          }
        ]
      }
    },
    createFeature(feature, browser, trackId, index) {
      const featureStart = Number(feature.start) || browser.start
      const start = Math.max(0, featureStart - 1)
      const featureEnd = String(feature.type || '').toUpperCase() === 'SNP'
        ? start + 1
        : Math.max(start + 1, Number(feature.end) || featureStart)
      const score = feature.value === null || feature.value === undefined ? undefined : Number(feature.value)
      return {
        uniqueId: `${trackId}-${index}-${this.safeId(feature.id || feature.label || 'feature')}`,
        refName: browser.chromosome,
        start,
        end: featureEnd,
        name: feature.label || feature.id,
        type: feature.type,
        score,
        ...(feature.details || {})
      }
    },
    safeId(value) {
      return String(value || 'track').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'track'
    },
    cleanupJBrowse() {
      if (this._jbrowseReactRoot) {
        this._jbrowseReactRoot.unmount()
        this._jbrowseReactRoot = null
      }
      this._jbrowseViewState = null
      const container = this.$refs.jbrowse
      if (container) container.replaceChildren()
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
  max-width: 1680px;
  height: 94vh;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.32);
}

.browser-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  border-bottom: 1px solid #dbe2eb;
}

.browser-header h2 {
  margin: 0;
  height: auto;
  border-radius: 0;
  background: transparent;
  color: #20385f;
  font-size: 1.35rem;
  line-height: 1.3;
}

.browser-header h2::before {
  display: none;
  content: none;
}

.browser-header p {
  margin: 3px 0 0;
  color: #68788c;
  font-size: 0.85rem;
}

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

.close-button:hover {
  background: #d8e2ed;
}

.browser-error {
  margin: 18px 22px;
  padding: 12px 14px;
  border-radius: 5px;
  background: #fff0f1;
  color: #a62c3d;
}

.browser-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #607287;
}

.browser-loading span {
  width: 20px;
  height: 20px;
  border: 3px solid #d8e1eb;
  border-top-color: #315f93;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.jbrowse-container {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fff;
}
</style>

<style>
body.cpc-genome-browser-open > .MuiModal-root,
body.cpc-genome-browser-open > .MuiPopover-root {
  z-index: 5100 !important;
}

body.cpc-genome-browser-open > .MuiPopper-root,
body.cpc-genome-browser-open > .MuiTooltip-popper {
  z-index: 5300 !important;
}
</style>
