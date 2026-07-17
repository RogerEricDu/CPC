<template>
  <div class="variant-query-page">
    <section class="query-card">
      <div class="query-card-heading">
        <div>
          <h2>SV query</h2>
          <p>Search structural variants by identifier, type, or overlapping genomic interval.</p>
        </div>
        <span class="assembly-badge">CHM13v2.0</span>
      </div>

      <div class="query-grid">
        <div class="form-group id-field">
          <label for="sv-id">SV ID</label>
          <input id="sv-id" v-model.trim="query.uniqueId" class="form-control" type="text" placeholder="CPC ID or source ID">
        </div>
        <div class="form-group">
          <label for="sv-type">SV type</label>
          <select id="sv-type" v-model="query.SVType" class="form-control">
            <option value="">All types</option>
            <option value="DEL">Deletion (DEL)</option>
            <option value="DUP">Duplication (DUP)</option>
            <option value="INS">Insertion (INS)</option>
            <option value="INV">Inversion (INV)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sv-chromosome">Chromosome</label>
          <select id="sv-chromosome" v-model="query.chromosome" class="form-control">
            <option value="">All chromosomes</option>
            <option v-for="chromosome in chromosomes" :key="chromosome" :value="chromosome">{{ chromosome }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="sv-start">Region start</label>
          <input id="sv-start" v-model.number="query.start" class="form-control" type="number" min="1" placeholder="Start coordinate">
        </div>
        <div class="form-group">
          <label for="sv-end">Region end</label>
          <input id="sv-end" v-model.number="query.end" class="form-control" type="number" min="1" placeholder="End coordinate">
        </div>
      </div>

      <div class="query-actions">
        <button type="button" class="secondary-button" :disabled="loading" @click="reset">Reset</button>
        <button type="button" class="primary-button" :disabled="loading" @click="runQuery(true)">
          {{ loading ? 'Searching…' : 'Search SVs' }}
        </button>
      </div>
    </section>

    <div v-if="error" class="status-message error-message">{{ error }}</div>
    <div v-if="loading" class="loading-state"><span></span>Searching indexed variants…</div>

    <template v-if="searched && !loading">
      <div v-if="frequencyLoading" class="map-loading"><span></span>Loading population frequencies…</div>
      <FrequencyMap v-else-if="frequency" :frequency="frequency" />
      <div v-else-if="frequencyError" class="status-message warning-message">{{ frequencyError }}</div>

      <section v-if="results.length" class="results-card">
        <div class="results-heading">
          <div>
            <h3>Query results</h3>
            <p>{{ formatInteger(total) }} variants · Page {{ page }} of {{ totalPages }}</p>
          </div>
          <label class="page-size-control">
            Rows
            <select v-model.number="size" @change="changePageSize">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SV ID</th>
                <th>Source ID</th>
                <th>Type</th>
                <th>Interval</th>
                <th>Length</th>
                <th>Panel frequency</th>
                <th>Novelty</th>
                <th class="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="variant in results"
                :key="variant.sourceId"
                :class="{ selected: selectedVariant && selectedVariant.sourceId === variant.sourceId }"
                @click="variant.frequencyAvailable && selectVariant(variant)"
              >
                <td class="identifier">{{ variant.id }}</td>
                <td class="source-id">{{ variant.sourceId }}</td>
                <td><span class="type-badge" :class="variant.type.toLowerCase()">{{ variant.type }}</span></td>
                <td>{{ variant.chromosome }}:{{ formatInteger(variant.start) }}-{{ formatInteger(variant.end) }}</td>
                <td>{{ formatInteger(variant.length) }} bp</td>
                <td>{{ formatPercent(variant.globalFrequency) }}</td>
                <td>{{ variant.novelty }}</td>
                <td class="row-actions" @click.stop>
                  <button
                    type="button"
                    class="frequency-button"
                    :disabled="!variant.frequencyAvailable"
                    @click="selectVariant(variant)"
                  >Frequency</button>
                  <button type="button" class="browser-button" @click="openBrowser(variant)">Genome browser</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Previous</button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button type="button" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">Next</button>
        </div>
      </section>

      <div v-else class="empty-state">No structural variants matched the query.</div>
    </template>

    <GenomeBrowserModal
      kind="sv"
      :visible="browserVisible"
      :variant="browserVariant"
      @close="browserVisible = false"
    />
  </div>
</template>

<script>
import { getSvFrequency, searchSV } from '@/api/variant'
import FrequencyMap from '@/components/variant/FrequencyMap.vue'
import GenomeBrowserModal from '@/components/variant/GenomeBrowserModal.vue'

export default {
  name: 'SVQuery',
  components: { FrequencyMap, GenomeBrowserModal },
  data() {
    return {
      query: {
        uniqueId: '',
        SVType: '',
        chromosome: '',
        start: null,
        end: null
      },
      chromosomes: Array.from({ length: 22 }, (_, index) => 'chr' + (index + 1)).concat(['chrX', 'chrY', 'chrM']),
      page: 1,
      size: 20,
      total: 0,
      results: [],
      selectedVariant: null,
      frequency: null,
      frequencyLoading: false,
      frequencyError: '',
      frequencyRequestId: 0,
      loading: false,
      searched: false,
      error: '',
      browserVisible: false,
      browserVariant: null
    }
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.size))
    }
  },
  methods: {
    async runQuery(resetPage) {
      if (this.loading) return
      if (this.query.start && this.query.end && this.query.end < this.query.start) {
        this.error = 'Region end must be greater than or equal to region start.'
        return
      }
      if (resetPage) this.page = 1
      this.loading = true
      this.error = ''
      this.frequency = null
      this.frequencyError = ''
      this.searched = true
      try {
        const response = await searchSV({
          uniqueId: this.query.uniqueId || null,
          SVType: this.query.SVType || null,
          chromosome: this.query.chromosome || null,
          start: this.query.start || null,
          end: this.query.end || null,
          page: this.page,
          size: this.size
        })
        this.results = response.data || []
        this.total = Number(response.total || 0)
        const initialVariant = this.results.find(variant => variant.frequencyAvailable)
        if (initialVariant) {
          await this.selectVariant(initialVariant)
        } else {
          this.selectedVariant = this.results[0] || null
          if (this.results.length) this.frequencyError = 'Population frequencies are not available for the variants on this page.'
        }
      } catch (error) {
        this.results = []
        this.total = 0
        this.selectedVariant = null
        this.error = (error.response && error.response.data && error.response.data.message) || 'Unable to search SV data.'
      } finally {
        this.loading = false
      }
    },
    async selectVariant(variant) {
      if (!variant || !variant.frequencyAvailable) return
      this.selectedVariant = variant
      this.frequency = null
      this.frequencyError = ''
      const requestId = ++this.frequencyRequestId
      this.frequencyLoading = true
      try {
        const response = await getSvFrequency({ id: variant.id })
        if (requestId === this.frequencyRequestId) this.frequency = response.data
      } catch (error) {
        if (requestId === this.frequencyRequestId) {
          this.frequencyError = (error.response && error.response.data && error.response.data.message) || 'Population frequencies are unavailable for this SV.'
        }
      } finally {
        if (requestId === this.frequencyRequestId) this.frequencyLoading = false
      }
    },
    openBrowser(variant) {
      this.browserVariant = variant
      this.browserVisible = true
    },
    changePage(nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) return
      this.page = nextPage
      this.runQuery(false)
    },
    changePageSize() {
      this.page = 1
      this.runQuery(false)
    },
    reset() {
      this.query = { uniqueId: '', SVType: '', chromosome: '', start: null, end: null }
      this.page = 1
      this.size = 20
      this.total = 0
      this.results = []
      this.selectedVariant = null
      this.frequency = null
      this.frequencyError = ''
      this.error = ''
      this.searched = false
    },
    formatPercent(value) {
      return ((Number(value) || 0) * 100).toFixed(3) + '%'
    },
    formatInteger(value) {
      return Number(value || 0).toLocaleString()
    }
  }
}
</script>

<style scoped>
.variant-query-page {
  width: min(1500px, 100%);
  margin: 0 auto;
  padding: 8px 20px 32px;
}
.query-card,
.results-card {
  border: 1px solid #dce3ec;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(32, 52, 84, 0.07);
}
.query-card { padding: 26px 28px; }
.query-card-heading,
.results-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}
.query-card-heading h2,
.results-heading h3 { margin: 0 0 5px; color: #213a66; }
.query-card-heading p,
.results-heading p { margin: 0; color: #69798c; font-size: 0.9rem; }
.assembly-badge {
  padding: 6px 11px;
  border-radius: 999px;
  background: #e6eef7;
  color: #294f7d;
  font-size: 0.8rem;
  font-weight: 700;
}
.query-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr 0.75fr 1fr 1fr;
  gap: 16px;
}
.form-group label { display: block; margin-bottom: 7px; color: #40536c; font-size: 0.88rem; font-weight: 700; }
.form-control {
  box-sizing: border-box;
  width: 100%;
  height: 43px;
  padding: 0 12px;
  border: 1px solid #bac6d4;
  border-radius: 6px;
  background: #fff;
  color: #26384f;
  font: inherit;
}
.form-control:focus { outline: 0; border-color: #315f93; box-shadow: 0 0 0 3px rgba(49, 95, 147, 0.12); }
.query-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.primary-button,
.secondary-button,
.pagination button,
.row-actions button {
  border: 0;
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.primary-button,
.secondary-button { min-width: 124px; padding: 11px 20px; font-size: 0.95rem; }
.primary-button { background: #294f7d; }
.primary-button:hover:not(:disabled) { background: #1f4069; }
.secondary-button { background: #66788d; }
.secondary-button:hover:not(:disabled) { background: #52657b; }
button:disabled { opacity: 0.38; cursor: not-allowed; }
.loading-state,
.map-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 34px; color: #617287; }
.loading-state span,
.map-loading span { width: 20px; height: 20px; border: 3px solid #dce4ed; border-top-color: #315f93; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.status-message { margin: 18px 0; padding: 13px 15px; border-radius: 7px; }
.error-message { border: 1px solid #efc4ca; background: #fff1f2; color: #a42e3e; }
.warning-message { border: 1px solid #ebd19d; background: #fff8e8; color: #795515; }
.results-card { margin-top: 24px; overflow: hidden; }
.results-heading { align-items: center; margin: 0; padding: 20px 22px; border-bottom: 1px solid #e0e6ed; }
.page-size-control { display: inline-flex; align-items: center; gap: 8px; color: #607187; font-size: 0.85rem; }
.page-size-control select { padding: 6px 8px; border: 1px solid #b9c5d3; border-radius: 5px; background: #fff; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 1320px; border-collapse: collapse; table-layout: auto; }
th,
td { padding: 13px 14px; border-bottom: 1px solid #e3e8ee; text-align: left; white-space: nowrap; font-size: 0.86rem; }
th { background: #f3f6f9; color: #29435f; font-weight: 700; }
tbody tr { transition: background 0.15s ease; }
tbody tr:hover { background: #f1f6fb; }
tbody tr.selected { background: #e7f0f9; box-shadow: inset 4px 0 #315f93; }
.identifier { color: #255e9a; font-weight: 700; }
.source-id { max-width: 220px; overflow: hidden; text-overflow: ellipsis; color: #5d6e83; }
.type-badge { display: inline-block; min-width: 38px; padding: 3px 7px; border-radius: 4px; text-align: center; font-weight: 800; }
.type-badge.del { background: #fde5e7; color: #ad2838; }
.type-badge.dup { background: #e1f4e8; color: #23724c; }
.type-badge.ins { background: #e3eef9; color: #225f94; }
.type-badge.inv { background: #eee5f6; color: #674381; }
.actions-column { min-width: 220px; }
.row-actions { display: flex; gap: 7px; }
.row-actions button { padding: 7px 10px; font-size: 0.78rem; }
.frequency-button { background: #2f6e9f; }
.frequency-button:hover:not(:disabled) { background: #24587f; }
.browser-button { background: #72558d; }
.browser-button:hover { background: #5d4475; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 18px; }
.pagination button { min-width: 92px; padding: 8px 13px; background: #405e80; }
.pagination span { color: #586a80; font-size: 0.87rem; font-weight: 600; }
.empty-state { margin-top: 24px; padding: 44px; border: 1px dashed #c7d1dd; border-radius: 10px; background: #f8fafc; color: #68798d; text-align: center; }

@media (max-width: 1120px) {
  .query-grid { grid-template-columns: repeat(2, 1fr); }
  .id-field { grid-column: span 2; }
}
@media (max-width: 700px) {
  .variant-query-page { padding-inline: 10px; }
  .query-grid { grid-template-columns: 1fr; }
  .id-field { grid-column: auto; }
  .query-card-heading,
  .results-heading { align-items: flex-start; flex-direction: column; }
  .query-actions { justify-content: stretch; }
  .query-actions button { flex: 1; }
}
</style>
