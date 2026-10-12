<template>
  <div class="sequence-tube-map">
    <section class="query-card">
      <div class="section-heading">
        <div>
          <h2>Sequence Tube Map</h2>
          <p>Explore local pangenome graph paths and overlapping caQTL/eQTL signals.</p>
        </div>
        <span v-if="loci.length" class="dataset-count">{{ loci.length }} loci</span>
      </div>

      <div v-if="lociLoading" class="state-row">
        <span class="spinner"></span>
        <span>Loading available loci...</span>
      </div>

      <template v-else>
        <div class="form-grid">
          <div class="form-group locus-field">
            <label for="tube-map-locus">Locus</label>
            <select
              id="tube-map-locus"
              v-model="locusGene"
              class="form-control"
              :disabled="loading || !loci.length"
              @change="onLocusChange"
            >
              <option value="">Select a locus</option>
              <option v-for="locus in loci" :key="locus.gene" :value="locus.gene">
                {{ locus.gene }} · {{ locus.chromosome }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="tube-map-start">Local start</label>
            <input
              id="tube-map-start"
              v-model.number="start"
              class="form-control"
              type="number"
              min="0"
              :max="selectedLocus ? selectedLocus.localLength - 1 : null"
              :disabled="loading || !selectedLocus"
            >
          </div>

          <div class="form-group">
            <label for="tube-map-end">Local end</label>
            <input
              id="tube-map-end"
              v-model.number="end"
              class="form-control"
              type="number"
              min="1"
              :max="selectedLocus ? selectedLocus.localLength : null"
              :disabled="loading || !selectedLocus"
            >
          </div>
        </div>

        <div v-if="selectedLocus" class="locus-summary">
          <div>
            <span class="summary-label">Assembly</span>
            <strong>{{ selectedLocus.assembly }}</strong>
          </div>
          <div>
            <span class="summary-label">Reference path</span>
            <strong>{{ selectedLocus.path }}</strong>
          </div>
          <div>
            <span class="summary-label">Source interval</span>
            <strong>{{ formatInteger(selectedLocus.globalStart) }}–{{ formatInteger(selectedLocus.globalEnd) }}</strong>
          </div>
          <div>
            <span class="summary-label">Local length</span>
            <strong>{{ formatInteger(selectedLocus.localLength) }} bp</strong>
          </div>
        </div>

        <div class="query-options">
          <label class="check-option">
            <input v-model="simplifyHaplotypes" type="checkbox" :disabled="loading">
            <span>Simplify redundant haplotype paths</span>
          </label>
          <label class="check-option">
            <input v-model="showNodeSequences" type="checkbox" :disabled="loading">
            <span>Include node sequences</span>
          </label>
          <span class="interval-note">Maximum interval: {{ formatInteger(MAX_SPAN) }} bp</span>
        </div>

        <div v-if="rangeValidation" class="validation-message">{{ rangeValidation }}</div>

        <div class="form-actions">
          <button type="button" class="secondary-btn" :disabled="loading" @click="handleReset">Reset</button>
          <button
            type="button"
            class="primary-btn"
            :disabled="loading || lociLoading"
            @click="handleQuery"
          >
            {{ loading ? 'Loading graph...' : 'Query graph' }}
          </button>
        </div>
      </template>
    </section>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <section v-if="resultMeta" class="result-card">
      <div class="result-heading">
        <div>
          <h3>{{ resultMeta.locus.gene }} sequence graph</h3>
          <p>
            {{ resultMeta.locus.assembly }} · {{ resultMeta.locus.chromosome }}:
            {{ formatInteger(resultGlobalStart) }}–{{ formatInteger(resultGlobalEnd) }}
          </p>
        </div>
        <span v-if="resultMeta.stats.cached" class="cache-badge">Cached</span>
      </div>

      <div class="stats-grid">
        <div class="stat-item"><strong>{{ formatInteger(resultMeta.stats.nodeCount) }}</strong><span>Nodes</span></div>
        <div class="stat-item"><strong>{{ formatInteger(resultMeta.stats.graphPathCount) }}</strong><span>Graph paths</span></div>
        <div class="stat-item ca-stat"><strong>{{ formatInteger(resultMeta.stats.caQtlCount) }}</strong><span>caQTL</span></div>
        <div class="stat-item eq-stat"><strong>{{ formatInteger(resultMeta.stats.eQtlCount) }}</strong><span>eQTL</span></div>
        <div class="stat-item"><strong>{{ formatDuration(resultMeta.stats.durationMs) }}</strong><span>Extraction</span></div>
      </div>

      <div class="viewer-toolbar">
        <div class="toolbar-group" aria-label="Interval navigation">
          <button type="button" :disabled="loading || !canShiftLeft" @click="shiftWindow(-1)">← Previous interval</button>
          <button type="button" :disabled="loading || !canShiftRight" @click="shiftWindow(1)">Next interval →</button>
        </div>
        <div class="toolbar-group" aria-label="Visualization controls">
          <button type="button" :disabled="rendering" title="Zoom out" @click="zoomMap(1 / 1.5)">−</button>
          <button type="button" :disabled="rendering" title="Reset view" @click="resetMapZoom">Reset view</button>
          <button type="button" :disabled="rendering" title="Zoom in" @click="zoomMap(1.5)">+</button>
          <button type="button" :disabled="rendering" @click="exportSvg">Export SVG</button>
        </div>
      </div>

      <div class="display-options">
        <label class="check-option">
          <input v-model="mergeNodes" type="checkbox" :disabled="rendering" @change="updateMergeNodes">
          <span>Merge redundant nodes</span>
        </label>
        <label class="check-option">
          <input v-model="transparentNodes" type="checkbox" :disabled="rendering" @change="updateTransparentNodes">
          <span>Transparent nodes</span>
        </label>
        <label class="check-option">
          <input v-model="showQtlTracks" type="checkbox" :disabled="rendering" @change="updateQtlVisibility">
          <span>Show QTL tracks</span>
        </label>
        <label class="width-option">
          <span>Node width</span>
          <select
            v-model="nodeWidthMode"
            :disabled="rendering || resultMeta.sequencesRemoved"
            @change="updateNodeWidth"
          >
            <option value="compressed">Compressed</option>
            <option value="normal">Sequence length</option>
          </select>
        </label>
      </div>

      <div class="map-legend" aria-label="Track colors">
        <span><i class="legend-line graph-line"></i>Reference path</span>
        <span><i class="legend-line haplotype-line"></i>Haplotype paths</span>
        <span><i class="legend-line ca-line"></i>caQTL</span>
        <span><i class="legend-line eq-line"></i>eQTL</span>
      </div>

      <div class="viewer-shell">
        <div v-if="rendering" class="viewer-loading">
          <span class="spinner"></span>
          <span>Rendering sequence graph...</span>
        </div>
        <svg :id="svgId" class="tube-map-svg" aria-label="Sequence tube map visualization"></svg>
      </div>
    </section>

    <section v-if="resultMeta" class="qtl-card">
      <div class="section-heading qtl-heading">
        <div>
          <h3>QTL results</h3>
          <p>{{ filteredQtlRecords.length }} of {{ qtlRecords.length }} overlapping records</p>
        </div>
      </div>

      <div class="qtl-filters">
        <div class="form-group">
          <label for="qtl-type">QTL type</label>
          <select id="qtl-type" v-model="qtlType" class="form-control" @change="resetQtlPage">
            <option value="">All types</option>
            <option value="caQTL">caQTL</option>
            <option value="eQTL">eQTL</option>
          </select>
        </div>
        <div class="form-group qtl-search">
          <label for="qtl-search">Variant or phenotype</label>
          <input
            id="qtl-search"
            v-model.trim="qtlSearch"
            class="form-control"
            type="search"
            placeholder="Filter results"
            @input="resetQtlPage"
          >
        </div>
        <div class="form-group">
          <label for="qtl-pvalue">Maximum P value</label>
          <input
            id="qtl-pvalue"
            v-model.trim="qtlMaxPValue"
            class="form-control"
            type="number"
            min="0"
            step="any"
            placeholder="No limit"
            @input="resetQtlPage"
          >
        </div>
      </div>

      <div v-if="filteredQtlRecords.length" class="qtl-table-wrap">
        <table class="qtl-table">
          <thead>
            <tr>
              <th class="type-column">Type</th>
              <th>Variant</th>
              <th>Phenotype</th>
              <th>P value</th>
              <th>Effect</th>
              <th>Allele frequency</th>
              <th class="details-column">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in pagedQtlRecords"
              :key="record.trackId"
              @mouseenter="highlightQtl(record)"
              @mouseleave="clearQtlHighlight(record)"
            >
              <td><span class="qtl-type" :class="record.type === 'caQTL' ? 'ca' : 'eq'">{{ record.type }}</span></td>
              <td class="truncate-cell" :title="record.variant">{{ record.variant || '—' }}</td>
              <td class="truncate-cell" :title="record.phenotype">{{ record.phenotype || '—' }}</td>
              <td>{{ formatScientific(record.pvalue) }}</td>
              <td>{{ formatScientific(record.slope) }}</td>
              <td>{{ formatPercentValue(record.alleleFrequency) }}</td>
              <td><button type="button" class="details-btn" @click="showQtlDetails(record)">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">No QTL records match the current filters.</div>

      <div v-if="qtlTotalPages > 1" class="pagination">
        <button type="button" :disabled="qtlPage === 1" @click="setQtlPage(qtlPage - 1)">Previous</button>
        <button
          v-for="pageNumber in qtlPageNumbers"
          :key="pageNumber"
          type="button"
          :class="{ active: pageNumber === qtlPage }"
          @click="setQtlPage(pageNumber)"
        >{{ pageNumber }}</button>
        <button type="button" :disabled="qtlPage === qtlTotalPages" @click="setQtlPage(qtlPage + 1)">Next</button>
      </div>
    </section>

    <div v-if="infoVisible" class="modal-backdrop" @click.self="closeInfo">
      <div class="info-modal" role="dialog" aria-modal="true" :aria-label="infoTitle">
        <div class="modal-header">
          <h3>{{ infoTitle }}</h3>
          <button type="button" aria-label="Close" @click="closeInfo">×</button>
        </div>
        <div class="modal-body">
          <table>
            <tbody>
              <tr v-for="(row, index) in infoRows" :key="index">
                <th>{{ row.label }}</th>
                <td>{{ row.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getSequenceTubeMapLoci, querySequenceTubeMap } from '@/api/sequenceTubeMap'

const MAX_SPAN = 10000
const QTL_PAGE_SIZE = 15

export default {
  name: 'SequenceTubeMap',
  data() {
    return {
      MAX_SPAN,
      svgId: `cpc-sequence-tube-map-${this._uid}`,
      loci: [],
      lociLoading: true,
      locusGene: '',
      start: null,
      end: null,
      simplifyHaplotypes: true,
      showNodeSequences: false,
      loading: false,
      rendering: false,
      errorMessage: '',
      resultMeta: null,
      mergeNodes: true,
      transparentNodes: false,
      showQtlTracks: true,
      nodeWidthMode: 'compressed',
      qtlRecords: [],
      qtlType: '',
      qtlSearch: '',
      qtlMaxPValue: '',
      qtlPage: 1,
      qtlPageSize: QTL_PAGE_SIZE,
      infoVisible: false,
      infoTitle: 'Object information',
      infoRows: []
    }
  },
  computed: {
    selectedLocus() {
      return this.loci.find(locus => locus.gene === this.locusGene) || null
    },
    rangeValidation() {
      if (!this.locusGene) return 'Select a locus to define the query interval.'
      if (!Number.isInteger(Number(this.start)) || !Number.isInteger(Number(this.end))) {
        return 'Start and end positions must be whole numbers.'
      }
      const start = Number(this.start)
      const end = Number(this.end)
      if (start < 0 || end <= start) return 'End position must be greater than start position.'
      if (this.selectedLocus && end > this.selectedLocus.localLength) {
        return 'The selected interval exceeds the locus boundary.'
      }
      if (end - start > MAX_SPAN) return `The selected interval must not exceed ${MAX_SPAN.toLocaleString()} bp.`
      return ''
    },
    resultGlobalStart() {
      return this.resultMeta ? Number(this.resultMeta.locus.globalStart) + Number(this.resultMeta.region[0]) : 0
    },
    resultGlobalEnd() {
      return this.resultMeta ? Number(this.resultMeta.locus.globalStart) + Number(this.resultMeta.region[1]) : 0
    },
    canShiftLeft() {
      return Boolean(this.resultMeta && Number(this.resultMeta.region[0]) > 0)
    },
    canShiftRight() {
      return Boolean(this.resultMeta && Number(this.resultMeta.region[1]) < Number(this.resultMeta.locus.localLength))
    },
    filteredQtlRecords() {
      const search = this.qtlSearch.toLowerCase()
      const maxP = this.qtlMaxPValue === '' ? null : Number(this.qtlMaxPValue)
      return this.qtlRecords.filter(record => {
        if (this.qtlType && record.type !== this.qtlType) return false
        if (search && !`${record.variant || ''} ${record.phenotype || ''}`.toLowerCase().includes(search)) return false
        if (maxP !== null && Number.isFinite(maxP)) {
          const pvalue = Number(record.pvalue)
          if (!Number.isFinite(pvalue) || pvalue > maxP) return false
        }
        return true
      })
    },
    qtlTotalPages() {
      return Math.max(1, Math.ceil(this.filteredQtlRecords.length / this.qtlPageSize))
    },
    pagedQtlRecords() {
      const start = (this.qtlPage - 1) * this.qtlPageSize
      return this.filteredQtlRecords.slice(start, start + this.qtlPageSize)
    },
    qtlPageNumbers() {
      const total = this.qtlTotalPages
      const first = Math.max(1, Math.min(this.qtlPage - 2, total - 4))
      const last = Math.min(total, first + 4)
      return Array.from({ length: last - first + 1 }, (_, index) => first + index)
    }
  },
  created() {
    this._queryRequestId = 0
    this._tubeMap = null
    this._tubeData = null
    this.loadLoci()
  },
  beforeDestroy() {
    this._queryRequestId += 1
    if (this._tubeMap) this._tubeMap.destroy()
  },
  methods: {
    async loadLoci() {
      this.lociLoading = true
      this.errorMessage = ''
      try {
        const response = await getSequenceTubeMapLoci()
        this.loci = Array.isArray(response.data) ? response.data : []
        if (this.loci.length) {
          this.locusGene = this.loci[0].gene
          this.applyLocusDefaults()
        }
      } catch (error) {
        this.loci = []
        this.errorMessage = this.apiError(error, 'Unable to load sequence graph loci.')
      } finally {
        this.lociLoading = false
      }
    },
    onLocusChange() {
      this.applyLocusDefaults()
      this.clearResult()
    },
    applyLocusDefaults() {
      const locus = this.selectedLocus
      this.start = locus ? Number(locus.defaultStart) : null
      this.end = locus ? Number(locus.defaultEnd) : null
    },
    handleReset() {
      this.errorMessage = ''
      this.simplifyHaplotypes = true
      this.showNodeSequences = false
      this.mergeNodes = true
      this.transparentNodes = false
      this.showQtlTracks = true
      this.nodeWidthMode = 'compressed'
      this.applyLocusDefaults()
      this.clearResult()
    },
    clearResult() {
      this._queryRequestId += 1
      if (this._tubeMap) this._tubeMap.destroy()
      this._tubeData = null
      this.resultMeta = null
      this.qtlRecords = []
      this.qtlType = ''
      this.qtlSearch = ''
      this.qtlMaxPValue = ''
      this.qtlPage = 1
      this.infoVisible = false
    },
    async handleQuery() {
      if (this.loading) return
      if (this.rangeValidation) {
        this.errorMessage = this.rangeValidation
        return
      }
      const requestId = ++this._queryRequestId
      this.loading = true
      this.rendering = false
      this.errorMessage = ''
      this.infoVisible = false
      try {
        const response = await querySequenceTubeMap({
          gene: this.locusGene,
          start: Number(this.start),
          end: Number(this.end),
          simplifyHaplotypes: this.simplifyHaplotypes,
          removeSequences: !this.showNodeSequences
        })
        if (requestId !== this._queryRequestId) return
        const payload = response.data
        this.resultMeta = {
          locus: payload.locus,
          queryRegion: payload.queryRegion,
          region: payload.region,
          sequencesRemoved: payload.sequencesRemoved,
          simplifiedHaplotypes: payload.simplifiedHaplotypes,
          stats: payload.stats
        }
        this.qtlType = ''
        this.qtlSearch = ''
        this.qtlMaxPValue = ''
        this.qtlPage = 1
        await this.$nextTick()
        if (requestId !== this._queryRequestId) return
        this.rendering = true
        await new Promise(resolve => window.requestAnimationFrame(resolve))
        if (requestId !== this._queryRequestId) return
        await this.renderPayload(payload, requestId)
      } catch (error) {
        if (requestId !== this._queryRequestId) return
        if (this._tubeMap) this._tubeMap.destroy()
        this._tubeData = null
        this.resultMeta = null
        this.qtlRecords = []
        this.errorMessage = this.apiError(error, 'Unable to load the selected sequence graph interval.')
      } finally {
        if (requestId === this._queryRequestId) {
          this.loading = false
          this.rendering = false
        }
      }
    },
    async renderPayload(payload, requestId) {
      const tubeMap = await import(/* webpackChunkName: "database-sequence-tube-map-renderer" */ '@/utils/sequenceTubeMap/tubemap')
      if (requestId !== this._queryRequestId || !document.getElementById(this.svgId)) return
      if (!payload.graph || !Array.isArray(payload.graph.node) || !Array.isArray(payload.graph.path)) {
        throw new Error('Sequence graph response is malformed.')
      }
      tubeMap.destroy()
      this._tubeMap = tubeMap
      tubeMap.setMergeNodesFlag(this.mergeNodes)
      tubeMap.setTransparentNodesFlag(this.transparentNodes)
      tubeMap.setShowReadsFlag(this.showQtlTracks)
      tubeMap.setSoftClipsFlag(false)
      tubeMap.setNodeWidthOption(payload.sequencesRemoved ? 'fixed' : this.nodeWidthMode)
      tubeMap.setColoredNodes(Array.isArray(payload.coloredNodes) ? payload.coloredNodes : [])
      tubeMap.setColorSet(0, this.colorScheme('#243b64', 'greys'))
      tubeMap.setColorSet(2, this.colorScheme('lightColors', 'lightColors'))
      tubeMap.setColorSet(3, this.colorScheme('#c23f5a', '#c23f5a'))
      tubeMap.setColorSet(4, this.colorScheme('#356fa8', '#356fa8'))
      tubeMap.setInfoCallback((rows, title) => this.openInfo(rows, title))

      const nodes = tubeMap.vgExtractNodes(payload.graph)
      const tracks = tubeMap.vgExtractTracks(payload.graph, 0, 2)
      const reads = []
      let readOffset = 0
      const gam = Array.isArray(payload.gam) ? payload.gam : []
      gam.forEach((records, index) => {
        const extracted = tubeMap.vgExtractReads(
          nodes,
          tracks,
          Array.isArray(records) ? records : [],
          readOffset,
          index === 0 ? 3 : 4
        )
        reads.push(...extracted)
        readOffset += extracted.length
      })
      this._tubeData = { nodes, tracks, reads, region: payload.region }
      this.qtlRecords = reads
        .map(read => ({ trackId: read.id, ...(read.qtl || tubeMap.extractQTLMetadata(read) || {}) }))
        .filter(record => record.type === 'caQTL' || record.type === 'eQTL')

      tubeMap.create({
        svgID: `#${this.svgId}`,
        nodes,
        tracks,
        reads,
        region: payload.region,
        hideLegend: true
      })
    },
    colorScheme(mainPalette, auxPalette) {
      return {
        mainPalette,
        auxPalette,
        colorReadsByMappingQuality: false,
        alphaReadsByMappingQuality: false
      }
    },
    async shiftWindow(direction) {
      if (!this.resultMeta || this.loading) return
      const locusLength = Number(this.resultMeta.locus.localLength)
      const currentStart = Number(this.resultMeta.region[0])
      const currentEnd = Number(this.resultMeta.region[1])
      const width = currentEnd - currentStart
      let nextStart = direction < 0 ? Math.max(0, currentStart - width) : Math.min(locusLength - width, currentStart + width)
      nextStart = Math.max(0, nextStart)
      this.start = nextStart
      this.end = Math.min(locusLength, nextStart + width)
      await this.handleQuery()
    },
    zoomMap(factor) {
      if (this._tubeMap) this._tubeMap.zoomBy(factor)
    },
    resetMapZoom() {
      if (this._tubeMap) this._tubeMap.resetZoom()
    },
    updateMergeNodes() {
      if (this._tubeMap) this._tubeMap.setMergeNodesFlag(this.mergeNodes)
    },
    updateTransparentNodes() {
      if (this._tubeMap) this._tubeMap.setTransparentNodesFlag(this.transparentNodes)
    },
    updateQtlVisibility() {
      if (this._tubeMap) this._tubeMap.setShowReadsFlag(this.showQtlTracks)
    },
    updateNodeWidth() {
      if (this._tubeMap && this.resultMeta && !this.resultMeta.sequencesRemoved) {
        this._tubeMap.setNodeWidthOption(this.nodeWidthMode)
      }
    },
    exportSvg() {
      const source = document.getElementById(this.svgId)
      if (!source || !this.resultMeta) return
      const clone = source.cloneNode(true)
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      const serialized = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`
      const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${this.resultMeta.locus.gene}_${this.resultMeta.region[0]}-${this.resultMeta.region[1]}_tube-map.svg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    },
    highlightQtl(record) {
      if (this._tubeMap) this._tubeMap.highlightTrackByID(record.trackId)
    },
    clearQtlHighlight(record) {
      if (this._tubeMap) this._tubeMap.clearTrackHighlightByID(record.trackId)
    },
    showQtlDetails(record) {
      this.openInfo([
        ['QTL type', record.type],
        ['Variant', record.variant],
        ['Phenotype', record.phenotype],
        ['P value', record.pvalue],
        ['Effect', record.slope],
        ['Effect standard error', record.slopeSE],
        ['Allele frequency', record.alleleFrequency],
        ['Start distance', record.startDistance],
        ['End distance', record.endDistance],
        ['Minor allele samples', record.minorAlleleSamples],
        ['Minor allele count', record.minorAlleleCount]
      ], 'QTL details')
    },
    openInfo(rows, title) {
      this.infoRows = (Array.isArray(rows) ? rows : []).map(row => ({
        label: Array.isArray(row) ? row[0] : 'Value',
        value: this.displayValue(Array.isArray(row) ? row[1] : row)
      }))
      this.infoTitle = title || 'Object information'
      this.infoVisible = true
    },
    closeInfo() {
      this.infoVisible = false
    },
    resetQtlPage() {
      this.qtlPage = 1
    },
    setQtlPage(page) {
      this.qtlPage = Math.min(Math.max(1, Number(page) || 1), this.qtlTotalPages)
    },
    apiError(error, fallback) {
      return (error.response && error.response.data && error.response.data.message) || error.message || fallback
    },
    displayValue(value) {
      if (value === null || value === undefined || value === '') return '—'
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    },
    formatInteger(value) {
      return Number(value || 0).toLocaleString()
    },
    formatDuration(value) {
      const duration = Number(value || 0)
      return duration >= 1000 ? `${(duration / 1000).toFixed(2)} s` : `${duration} ms`
    },
    formatScientific(value) {
      if (value === null || value === undefined || value === '') return '—'
      const number = Number(value)
      if (!Number.isFinite(number)) return String(value)
      if (number === 0) return '0'
      return Math.abs(number) < 0.001 || Math.abs(number) >= 10000
        ? number.toExponential(3)
        : Number(number.toPrecision(4)).toString()
    },
    formatPercentValue(value) {
      if (value === null || value === undefined || value === '') return '—'
      const number = Number(value)
      return Number.isFinite(number) ? `${(number * 100).toFixed(2)}%` : String(value)
    }
  }
}
</script>

<style scoped>
.sequence-tube-map {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
  color: #303846;
}

.query-card,
.result-card,
.qtl-card {
  margin-bottom: 24px;
  padding: 28px;
  border: 1px solid #e0e6ef;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(36, 59, 100, 0.06);
}

.query-card { background: #f8f9fa; }

.section-heading,
.result-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.section-heading h2,
.section-heading h3,
.result-heading h3 {
  margin: 0 0 6px;
  color: #2b4275;
  font-weight: 650;
}

.section-heading h2 {
  height: auto;
  margin: 0 0 6px;
  border-radius: 0;
  background: transparent;
  color: #2b4275;
  font-size: 1.55rem;
  line-height: 1.25;
}

.section-heading h2::before { display: none; }
.section-heading h3,
.result-heading h3 { font-size: 1.3rem; }
.section-heading p,
.result-heading p { margin: 0; color: #667085; line-height: 1.5; }

.dataset-count,
.cache-badge {
  flex: 0 0 auto;
  padding: 5px 11px;
  border-radius: 999px;
  background: #e9eff8;
  color: #315f93;
  font-size: 0.85rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) minmax(150px, 0.75fr) minmax(150px, 0.75fr);
  gap: 18px;
}

.form-group { min-width: 0; }
.form-group label {
  display: block;
  margin-bottom: 7px;
  color: #4b5565;
  font-size: 0.93rem;
  font-weight: 600;
}

.form-control {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  border: 1px solid #cfd7e3;
  border-radius: 5px;
  background: #fff;
  color: #303846;
  font-size: 0.98rem;
}

.form-control:focus {
  outline: none;
  border-color: #5979c2;
  box-shadow: 0 0 0 3px rgba(89, 121, 194, 0.12);
}

.form-control:disabled { background: #eef1f5; color: #8a93a3; }

.locus-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 18px;
  overflow: hidden;
  border: 1px solid #dfe5ee;
  border-radius: 7px;
  background: #dfe5ee;
}

.locus-summary > div { min-width: 0; padding: 12px 14px; background: #fff; }
.summary-label { display: block; margin-bottom: 4px; color: #7b8494; font-size: 0.78rem; text-transform: uppercase; }
.locus-summary strong { display: block; overflow: hidden; color: #334b76; font-size: 0.9rem; text-overflow: ellipsis; white-space: nowrap; }

.query-options,
.display-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  margin-top: 20px;
}

.check-option { display: inline-flex; align-items: center; gap: 8px; color: #4b5565; cursor: pointer; }
.check-option input { width: 16px; height: 16px; accent-color: #315f93; }
.interval-note { margin-left: auto; color: #7b8494; font-size: 0.88rem; }

.validation-message { margin-top: 14px; color: #8a6019; font-size: 0.9rem; }
.form-actions { display: flex; justify-content: center; gap: 14px; margin-top: 24px; }

.primary-btn,
.secondary-btn,
.viewer-toolbar button,
.details-btn,
.pagination button {
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s, color 0.2s, transform 0.2s;
}

.primary-btn,
.secondary-btn { min-width: 135px; padding: 11px 24px; color: #fff; font-size: 1rem; }
.primary-btn { background: var(--main-color); }
.primary-btn:hover:not(:disabled) { background: #d87500; transform: translateY(-1px); }
.secondary-btn { background: #657184; }
.secondary-btn:hover:not(:disabled) { background: #515c6d; }
button:disabled { cursor: not-allowed; opacity: 0.48; }

.state-row,
.viewer-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #667085;
}
.state-row { min-height: 100px; }
.spinner { width: 19px; height: 19px; border: 3px solid #dfe5ee; border-top-color: #315f93; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-message {
  margin-bottom: 22px;
  padding: 14px 16px;
  border: 1px solid #f0c7ca;
  border-radius: 6px;
  background: #fff2f3;
  color: #a12832;
}

.stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-item { padding: 13px 14px; border: 1px solid #e2e7ef; border-radius: 7px; background: #f7f9fc; }
.stat-item strong { display: block; margin-bottom: 3px; color: #2b4275; font-size: 1.18rem; }
.stat-item span { color: #788293; font-size: 0.83rem; }
.ca-stat strong { color: #b73551; }
.eq-stat strong { color: #2d659d; }

.viewer-toolbar { display: flex; justify-content: space-between; gap: 14px; padding: 10px; border: 1px solid #dfe5ee; border-radius: 7px; background: #f6f8fb; }
.toolbar-group { display: flex; flex-wrap: wrap; gap: 8px; }
.viewer-toolbar button { min-height: 34px; padding: 7px 12px; border: 1px solid #c8d2e0; background: #fff; color: #315f93; }
.viewer-toolbar button:hover:not(:disabled) { border-color: #315f93; background: #eaf0f8; }

.display-options { margin: 15px 2px; }
.width-option { display: inline-flex; align-items: center; gap: 8px; color: #4b5565; }
.width-option select { padding: 5px 8px; border: 1px solid #ccd5e2; border-radius: 4px; background: #fff; }

.map-legend { display: flex; flex-wrap: wrap; gap: 12px 22px; margin: 12px 0; color: #5f6979; font-size: 0.86rem; }
.map-legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend-line { display: inline-block; width: 24px; height: 5px; border-radius: 4px; }
.graph-line { background: #243b64; }
.haplotype-line { background: linear-gradient(90deg, #abcce3, #d7c6e6, #b0dbb0); }
.ca-line { background: #c23f5a; }
.eq-line { background: #356fa8; }

.viewer-shell { position: relative; height: min(68vh, 650px); min-height: 500px; overflow: hidden; border: 1px solid #d9e1ec; border-radius: 8px; background: #fff; }
.tube-map-svg { display: block; width: 100%; height: 100%; }
.viewer-loading { position: absolute; inset: 0; z-index: 3; background: rgba(255, 255, 255, 0.88); }
::v-deep .qtl-track { filter: none; shape-rendering: geometricPrecision; }
::v-deep .qtl-track-boundary { fill: none; stroke: #202020; stroke-width: 1.25px; pointer-events: none; shape-rendering: geometricPrecision; }

.qtl-heading { margin-bottom: 18px; }
.qtl-filters { display: grid; grid-template-columns: 170px minmax(240px, 1fr) 210px; gap: 16px; margin-bottom: 18px; }
.qtl-table-wrap { overflow-x: auto; border: 1px solid #dfe5ee; border-radius: 7px; }
.qtl-table { width: 100%; min-width: 940px; table-layout: fixed; border-collapse: collapse; }
.qtl-table th,
.qtl-table td { padding: 11px 12px; border-bottom: 1px solid #e5e9f0; text-align: left; vertical-align: middle; }
.qtl-table th { background: #f3f6fa; color: #2b4275; font-size: 0.87rem; font-weight: 650; }
.qtl-table tbody tr:last-child td { border-bottom: 0; }
.qtl-table tbody tr:hover { background: #f5f8fc; }
.type-column { width: 90px; }
.details-column { width: 82px; }
.truncate-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qtl-type { display: inline-block; min-width: 54px; padding: 3px 7px; border-radius: 4px; text-align: center; font-size: 0.78rem; font-weight: 700; }
.qtl-type.ca { background: #fdecef; color: #aa2f49; }
.qtl-type.eq { background: #eaf2fb; color: #2c6297; }
.details-btn { padding: 6px 11px; background: #315f93; color: #fff; }
.details-btn:hover { background: #244a74; }
.empty-state { padding: 34px 20px; border-radius: 7px; background: #f7f8fa; color: #7b8494; text-align: center; }

.pagination { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; margin-top: 16px; }
.pagination button { min-width: 36px; padding: 7px 10px; border: 1px solid #cbd4e1; background: #fff; color: #40536f; }
.pagination button:hover:not(:disabled),
.pagination button.active { border-color: #315f93; background: #315f93; color: #fff; }

.modal-backdrop { position: fixed; inset: 0; z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(29, 39, 55, 0.58); }
.info-modal { width: min(680px, 100%); max-height: 82vh; overflow: hidden; border-radius: 9px; background: #fff; box-shadow: 0 18px 55px rgba(0, 0, 0, 0.24); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 17px 20px; border-bottom: 1px solid #e2e7ef; }
.modal-header h3 { margin: 0; color: #2b4275; }
.modal-header button { border: 0; background: transparent; color: #536175; font-size: 1.7rem; cursor: pointer; }
.modal-body { max-height: calc(82vh - 65px); overflow: auto; padding: 12px 20px 20px; }
.modal-body table { width: 100%; border-collapse: collapse; }
.modal-body th,
.modal-body td { padding: 10px; border-bottom: 1px solid #e8ebf0; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
.modal-body th { width: 190px; color: #536175; font-weight: 600; }

@media (max-width: 900px) {
  .form-grid { grid-template-columns: 1fr 1fr; }
  .locus-field { grid-column: 1 / -1; }
  .locus-summary { grid-template-columns: 1fr 1fr; }
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .qtl-filters { grid-template-columns: 1fr 1fr; }
  .qtl-search { grid-column: 1 / -1; grid-row: 1; }
}

@media (max-width: 640px) {
  .query-card,
  .result-card,
  .qtl-card { padding: 20px 16px; }
  .form-grid,
  .locus-summary,
  .stats-grid,
  .qtl-filters { grid-template-columns: 1fr; }
  .locus-field,
  .qtl-search { grid-column: auto; grid-row: auto; }
  .section-heading,
  .result-heading,
  .viewer-toolbar { flex-direction: column; }
  .interval-note { width: 100%; margin-left: 0; }
  .form-actions { flex-direction: column-reverse; }
  .primary-btn,
  .secondary-btn { width: 100%; }
  .viewer-shell { min-height: 430px; height: 62vh; }
  .modal-body th { width: 125px; }
}
</style>
