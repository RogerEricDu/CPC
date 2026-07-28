<template>
  <div class="sv-query">
    <div class="query-form">
      <ReferenceGenomeSwitch
        :value="queryParams.assembly"
        :assemblies="assemblies"
        :disabled="loading"
        @change="selectAssembly"
      />

      <div class="form-row">
        <div class="form-group">
          <label for="svType">SV Type:</label>
          <select id="svType" v-model="queryParams.SVType" class="form-select">
            <option value="">All Types</option>
            <option value="DEL">Deletion (DEL)</option>
            <option value="DUP">Duplication (DUP)</option>
            <option value="INS">Insertion (INS)</option>
            <option value="INV">Inversion (INV)</option>
            <option value="BND">Breakend (BND)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="svChromosome">Chromosome:</label>
          <select id="svChromosome" v-model="queryParams.chromosome" class="form-select">
            <option value="">Select Chromosome</option>
            <option v-for="chr in chromosomes" :key="chr" :value="chr">
              {{ chr }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="start">Start Position:</label>
          <input
            type="number"
            id="start"
            v-model.number="queryParams.start"
            placeholder="Start position"
            class="form-input"
          >
        </div>

        <div class="form-group">
          <label for="end">End Position:</label>
          <input
            type="number"
            id="end"
            v-model.number="queryParams.end"
            placeholder="End position"
            class="form-input"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="uniqueId">SV ID:</label>
        <input
          type="text"
          id="uniqueId"
          v-model="queryParams.uniqueId"
          :placeholder="svIdPlaceholder"
          class="form-input"
        >
      </div>

      <div class="form-group">
        <label for="svPopulation">Population:</label>
        <select
          id="svPopulation"
          v-model="queryParams.population"
          class="form-select"
          :disabled="loading || populationsLoading"
        >
          <option value="">All Populations</option>
          <option v-for="population in populations" :key="population.id" :value="population.id">
            {{ population.label }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button @click="handleReset" class="reset-btn">
          Reset
        </button>
        <button @click="handleViewAll" class="view-all-btn" :disabled="loading">
          {{ loading && viewAllMode ? 'Loading...' : 'View all results' }}
        </button>
        <button @click="handleQuery" :disabled="loading" class="query-btn">
          {{ loading ? 'Searching...' : 'Search SV' }}
        </button>
      </div>
    </div>

    <div v-if="loading && !frequency" class="loading">
      <div class="spinner"></div>
      <span>Loading data...</span>
    </div>

    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <template v-if="searched">
      <div v-if="frequencyLoading && !frequency" class="loading">
        <div class="spinner"></div>
        <span>Loading population frequencies...</span>
      </div>
      <FrequencyMap
        v-if="frequency"
        ref="frequencyMap"
        :frequency="frequency"
        :preferred-population="queryParams.population"
      />
      <div v-else-if="frequencyError && !loading" class="warning-message">{{ frequencyError }}</div>

      <template v-if="!loading">
      <div v-if="results && results.length > 0" class="results-section">
        <div class="results-header">
          <h3>SV Query Results</h3>
          <div class="results-info">Total: {{ total }} records</div>
        </div>

        <div class="results-table">
          <table>
            <thead>
              <tr>
                <th>SV ID</th>
                <th>Source ID</th>
                <th>Type</th>
                <th>Chromosome</th>
                <th>Start</th>
                <th>End</th>
                <th>Size (bp)</th>
                <th>Allele Frequency</th>
                <th>Novelty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="result in results"
                :key="result.sourceId"
                :class="{ selected: isSelected(result) }"
                @click="result.frequencyAvailable && selectVariant(result)"
              >
                <td class="identifier">{{ result.id || 'N/A' }}</td>
                <td class="source-id">{{ result.sourceId || 'N/A' }}</td>
                <td>
                  <span class="sv-type" :class="result.type ? result.type.toLowerCase() : ''">
                    {{ result.type || 'N/A' }}
                  </span>
                </td>
                <td>{{ result.chromosome || 'N/A' }}</td>
                <td>{{ formatInteger(result.start) }}</td>
                <td>{{ formatInteger(result.end) }}</td>
                <td>{{ formatInteger(result.length) }}</td>
                <td>{{ formatPercent(result.globalFrequency) }}</td>
                <td>{{ result.novelty || 'N/A' }}</td>
                <td class="row-actions" @click.stop>
                  <button
                    type="button"
                    class="frequency-btn"
                    :disabled="!result.frequencyAvailable"
                    @click="selectVariant(result)"
                  >Frequency</button>
                  <button type="button" class="browser-btn" @click="openBrowser(result)">Genome browser</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <VariantPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="goToPage"
        />
      </div>

      <div v-else class="no-results">
        <p>No results found</p>
      </div>
      </template>
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
import { getSvAssemblies, getSvFrequency, getSvPopulations, searchSV } from '@/api/variant'
import FrequencyMap from '@/components/variant/FrequencyMap.vue'
import GenomeBrowserModal from '@/components/variant/GenomeBrowserModal.vue'
import ReferenceGenomeSwitch from '@/components/variant/ReferenceGenomeSwitch.vue'
import VariantPagination from '@/components/variant/VariantPagination.vue'

export default {
  name: 'SVQuery',
  components: { FrequencyMap, GenomeBrowserModal, ReferenceGenomeSwitch, VariantPagination },
  data() {
    return {
      queryParams: {
        assembly: 'CHM13v2.0',
        population: '',
        chromosome: '',
        start: null,
        end: null,
        uniqueId: '',
        SVType: '',
        page: 1,
        size: 10
      },
      results: null,
      total: 0,
      currentPage: 1,
      pageSize: 10,
      loading: false,
      error: null,
      searched: false,
      assemblies: [
        { id: 'CHM13v2.0', label: 'CHM13v2.0', default: true },
        { id: 'GRCh38', label: 'GRCh38', default: false }
      ],
      populations: [],
      populationsLoading: false,
      chromosomes: Array.from({ length: 22 }, (_, index) => `chr${index + 1}`).concat(['chrX', 'chrY']),
      selectedVariant: null,
      frequency: null,
      frequencyLoading: false,
      frequencyError: '',
      frequencyRequestId: 0,
      browserVisible: false,
      browserVariant: null,
      viewAllMode: false
    }
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    svIdPlaceholder() {
      return this.queryParams.assembly === 'GRCh38'
        ? 'e.g., chr1_10862_INS_76bp'
        : 'e.g., chr1_11669_DEL_59bp'
    }
  },
  created() {
    this.loadAssemblies()
  },
  methods: {
    async loadAssemblies() {
      try {
        const response = await getSvAssemblies()
        if (!Array.isArray(response.data) || response.data.length === 0) return
        this.assemblies = response.data
        const selected = response.data.find(item => item.default) || response.data[0]
        if (!response.data.some(item => item.id === this.queryParams.assembly)) {
          this.queryParams.assembly = selected.id
        }
      } catch (error) {
        // Keep the built-in assembly options so the query endpoint can report availability.
      } finally {
        await this.loadPopulations()
      }
    },
    async loadPopulations() {
      this.populationsLoading = true
      try {
        const response = await getSvPopulations({ assembly: this.queryParams.assembly })
        this.populations = Array.isArray(response.data) ? response.data : []
        if (!this.populations.some(item => item.id === this.queryParams.population)) {
          this.queryParams.population = ''
        }
      } catch (error) {
        this.populations = []
        this.queryParams.population = ''
      } finally {
        this.populationsLoading = false
      }
    },
    selectAssembly(assembly) {
      if (!assembly || assembly === this.queryParams.assembly || this.loading) return
      this.queryParams.assembly = assembly
      this.queryParams.population = ''
      this.clearQueryOutput()
      this.loadPopulations()
    },
    hasSearchCriteria() {
      return Boolean(
        this.queryParams.uniqueId.trim() ||
        this.queryParams.population ||
        this.queryParams.SVType ||
        this.queryParams.chromosome ||
        this.queryParams.start ||
        this.queryParams.end
      )
    },
    clearQueryOutput() {
      this.frequencyRequestId++
      this.results = null
      this.total = 0
      this.selectedVariant = null
      this.frequency = null
      this.frequencyLoading = false
      this.frequencyError = ''
      this.error = null
      this.searched = false
      this.viewAllMode = false
    },
    async handleQuery() {
      if (this.loading) return
      if (!this.hasSearchCriteria()) {
        this.clearQueryOutput()
        return
      }
      if (this.queryParams.start && this.queryParams.end && this.queryParams.end < this.queryParams.start) {
        this.clearQueryOutput()
        this.error = 'End position must be greater than or equal to start position.'
        return
      }

      this.currentPage = 1
      await this.runQuery(false)
    },
    async handleViewAll() {
      if (this.loading) return
      this.queryParams = {
        assembly: this.queryParams.assembly,
        population: '',
        chromosome: '',
        start: null,
        end: null,
        uniqueId: '',
        SVType: '',
        page: 1,
        size: this.pageSize
      }
      this.currentPage = 1
      await this.runQuery(true)
    },
    async runQuery(viewAll) {
      this.viewAllMode = Boolean(viewAll)

      this.loading = true
      this.error = null
      this.frequencyError = ''
      this.searched = true

      try {
        const response = await searchSV({
          ...this.queryParams,
          uniqueId: this.queryParams.uniqueId.trim() || null,
          page: this.currentPage,
          size: this.pageSize,
          viewAll: this.viewAllMode
        })
        this.results = response.data || []
        this.total = Number(response.total || 0)
        const initialVariant = this.results.find(variant => variant.frequencyAvailable)
        if (initialVariant) {
          await this.selectVariant(initialVariant)
        } else {
          this.selectedVariant = this.results[0] || null
          this.frequency = null
          if (this.results.length > 0) {
            this.frequencyError = 'Population frequencies are not available for the variants on this page.'
          }
        }
      } catch (error) {
        this.results = []
        this.total = 0
        this.selectedVariant = null
        this.frequency = null
        this.error = (error.response && error.response.data && error.response.data.message) || 'Failed to search SV data. Please try again.'
      } finally {
        this.loading = false
      }
    },
    async selectVariant(variant) {
      if (!variant || !variant.frequencyAvailable) return
      this.selectedVariant = variant
      this.frequencyError = ''
      const requestId = ++this.frequencyRequestId
      this.frequencyLoading = true
      try {
        const response = await getSvFrequency({
          id: variant.id,
          assembly: variant.assembly || this.queryParams.assembly
        })
        if (requestId === this.frequencyRequestId) this.frequency = response.data
      } catch (error) {
        if (requestId === this.frequencyRequestId) {
          this.frequency = null
          this.frequencyError = (error.response && error.response.data && error.response.data.message) || 'Population frequencies are unavailable for this SV.'
        }
      } finally {
        if (requestId === this.frequencyRequestId) this.frequencyLoading = false
      }
    },
    isSelected(variant) {
      return Boolean(this.selectedVariant && this.selectedVariant.sourceId === variant.sourceId)
    },
    openBrowser(variant) {
      if (this.$refs.frequencyMap) this.$refs.frequencyMap.hideTooltip()
      this.browserVariant = variant
      this.browserVisible = true
    },
    handleReset() {
      this.queryParams = {
        assembly: this.queryParams.assembly,
        population: '',
        chromosome: '',
        start: null,
        end: null,
        uniqueId: '',
        SVType: '',
        page: 1,
        size: 10
      }
      this.currentPage = 1
      this.clearQueryOutput()
    },
    goToPage(targetPage) {
      if (this.loading) return
      const nextPage = Math.min(Math.max(1, Number(targetPage) || 1), this.totalPages)
      if (nextPage === this.currentPage) return
      this.currentPage = nextPage
      this.runQuery(this.viewAllMode)
    },
    formatPercent(value) {
      return `${((Number(value) || 0) * 100).toFixed(3)}%`
    },
    formatInteger(value) {
      return Number(value || 0).toLocaleString()
    }
  }
}
</script>

<style scoped>
.sv-query {
  max-width: 1200px;
  margin: 0 auto;
}

.query-form {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.query-form h2 {
  color: #2b4275;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 25px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #606266;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--main-color);
}

.query-btn {
  background-color: var(--main-color);
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.query-btn:hover:not(:disabled) {
  background-color: #e67e00;
}

.query-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #6c757d;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reset-btn:hover {
  background-color: #5a6268;
}

.view-all-btn {
  min-width: 160px;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background: #315f93;
  color: #fff;
  font-size: 1.05rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.view-all-btn:hover:not(:disabled) {
  background: #244a74;
}

.view-all-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #606266;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results-section {
  margin-top: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header h3 {
  color: #2b4275;
  margin: 0;
}

.results-info {
  color: #606266;
  font-weight: 500;
}

.results-table {
  overflow-x: auto;
  margin: 20px 0;
}

table {
  width: 100%;
  min-width: 1280px;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e4e7ed;
  white-space: nowrap;
}

th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #2b4275;
  position: sticky;
  top: 0;
}

tr:hover {
  background-color: #f5f7fa;
}

tr.selected {
  background-color: #edf5ff;
}

.identifier {
  color: #315f93;
  font-weight: 600;
}

.source-id {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sv-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.sv-type.del { background-color: #ffebee; color: #c62828; }
.sv-type.dup { background-color: #e8f5e8; color: #2e7d32; }
.sv-type.ins { background-color: #e3f2fd; color: #1565c0; }
.sv-type.inv { background-color: #f3e5f5; color: #7b1fa2; }
.sv-type.bnd { background-color: #fff3e0; color: #ef6c00; }

.row-actions {
  display: flex;
  gap: 8px;
}

.row-actions button {
  padding: 7px 10px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.row-actions button:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.frequency-btn { background: #2f6e9f; }
.frequency-btn:hover:not(:disabled) { background: #24587f; }
.browser-btn { background: #72558d; }
.browser-btn:hover { background: #5d4475; }

.no-results {
  text-align: center;
  padding: 40px;
  color: #606266;
  background: #f8f9fa;
  border-radius: 8px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid #f5c6cb;
}

.error-message p { margin: 0; }

.warning-message {
  padding: 15px;
  border: 1px solid #ebd19d;
  border-radius: 4px;
  background: #fff8e8;
  color: #795515;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

}
</style>
