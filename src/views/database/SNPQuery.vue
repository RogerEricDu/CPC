<template>
  <div class="snp-query">
    <div class="query-form">
      <div class="form-group">
        <label for="rsId">SNP ID (rsID):</label>
        <input
          type="text"
          id="rsId"
          v-model="rsId"
          placeholder="e.g., rs123456"
          class="form-input"
        >
      </div>

      <div class="form-group">
        <label for="chromosome">Chromosome:</label>
        <select id="chromosome" v-model="chromosome" class="form-select">
          <option value="">Select Chromosome</option>
          <option v-for="chr in chromosomes" :key="chr" :value="chr">
            {{ chr }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="position">Position:</label>
          <input
            type="number"
            id="position"
            v-model.number="position"
            placeholder="Genomic position"
            class="form-input"
            min="1"
          >
        </div>

        <div class="form-group">
          <label for="population">Population:</label>
          <select id="population" v-model="population" class="form-select">
            <option value="">All Populations</option>
            <option value="han">Han Chinese</option>
            <option value="zang">Tibetan</option>
            <option value="miao">Miao</option>
            <option value="mongolian">Mongolian</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="page">Page:</label>
          <input
            type="number"
            id="page"
            v-model.number="page"
            placeholder="Page number"
            class="form-input"
            min="1"
          >
        </div>

        <div class="form-group">
          <label for="size">Page Size:</label>
          <select id="size" v-model="size" class="form-select">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button @click="handleReset" class="reset-btn" :disabled="loading">
          Reset
        </button>
        <button @click="handleViewAll" class="view-all-btn" :disabled="loading">
          {{ loading && viewAllMode ? 'Loading...' : 'View all results' }}
        </button>
        <button @click="handleQuery" class="query-btn" :disabled="loading">
          {{ loading ? 'Querying...' : 'Query SNP' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading data...</span>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <template v-if="searched && !loading">
      <div v-if="frequencyLoading" class="loading">
        <div class="spinner"></div>
        <span>Loading population frequencies...</span>
      </div>
      <FrequencyMap v-else-if="frequency" ref="frequencyMap" :frequency="frequency" />
      <div v-else-if="frequencyError" class="warning-message">{{ frequencyError }}</div>

      <div v-if="results && results.length > 0" class="results-section">
        <div class="results-header">
          <h3>Query Results (Total: {{ total }})</h3>
          <div class="pagination-info">Page {{ page }} of {{ totalPages }}</div>
        </div>

        <div class="results-table">
          <table>
            <thead>
              <tr>
                <th>SNP ID</th>
                <th>Chromosome</th>
                <th>Position</th>
                <th>Ref Allele</th>
                <th>Alt Allele</th>
                <th>Ref Frequency</th>
                <th>Alt Frequency</th>
                <th>Allele Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="result in results"
                :key="result.chromosome + ':' + result.position + ':' + result.rsId"
                :class="{ selected: isSelected(result) }"
                @click="selectVariant(result)"
              >
                <td class="identifier">{{ result.rsId || 'N/A' }}</td>
                <td>{{ result.chromosome || 'N/A' }}</td>
                <td>{{ formatInteger(result.position) }}</td>
                <td>{{ result.refAllele || 'N/A' }}</td>
                <td>{{ result.altAllele || 'N/A' }}</td>
                <td>{{ formatPercent(result.refFrequency) }}</td>
                <td>{{ formatPercent(result.altFrequency) }}</td>
                <td>{{ formatInteger(result.alleleCount) }} / {{ formatInteger(result.alleleNumber) }}</td>
                <td class="row-actions" @click.stop>
                  <button type="button" class="frequency-btn" @click="selectVariant(result)">Frequency</button>
                  <button type="button" class="browser-btn" @click="openBrowser(result)">Genome browser</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="total > Number(size)" class="pagination">
          <button @click="prevPage" :disabled="page <= 1" class="page-btn">Previous</button>
          <span class="page-info">Page {{ page }}</span>
          <button @click="nextPage" :disabled="page >= totalPages" class="page-btn">Next</button>
        </div>
      </div>

      <div v-else class="no-results">
        No SNPs found matching your criteria.
      </div>
    </template>

    <GenomeBrowserModal
      kind="snp"
      :visible="browserVisible"
      :variant="browserVariant"
      @close="browserVisible = false"
    />
  </div>
</template>

<script>
import { getSnpFrequency, searchSNP } from '@/api/variant.js'
import FrequencyMap from '@/components/variant/FrequencyMap.vue'
import GenomeBrowserModal from '@/components/variant/GenomeBrowserModal.vue'

export default {
  name: 'SNPQuery',
  components: { FrequencyMap, GenomeBrowserModal },
  data() {
    return {
      rsId: '',
      chromosome: '',
      position: null,
      population: '',
      page: 1,
      size: 10,
      results: null,
      total: 0,
      loading: false,
      errorMessage: '',
      searched: false,
      chromosomes: Array.from({ length: 22 }, (_, index) => (index + 1).toString()).concat(['X', 'Y', 'M']),
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
      return Math.max(1, Math.ceil(this.total / Number(this.size || 10)))
    }
  },
  methods: {
    hasSearchCriteria() {
      return Boolean(this.rsId.trim() || this.chromosome || this.position)
    },
    clearQueryOutput() {
      this.frequencyRequestId++
      this.results = null
      this.total = 0
      this.selectedVariant = null
      this.frequency = null
      this.frequencyLoading = false
      this.frequencyError = ''
      this.errorMessage = ''
      this.searched = false
      this.viewAllMode = false
    },
    async handleQuery() {
      if (this.loading) return
      if (!this.hasSearchCriteria()) {
        this.clearQueryOutput()
        return
      }

      await this.runQuery(false)
    },
    async handleViewAll() {
      if (this.loading) return
      this.rsId = ''
      this.chromosome = ''
      this.position = null
      this.population = ''
      this.page = 1
      await this.runQuery(true)
    },
    async runQuery(viewAll) {
      this.viewAllMode = Boolean(viewAll)

      this.loading = true
      this.errorMessage = ''
      this.frequency = null
      this.frequencyError = ''
      this.searched = true

      try {
        const response = await searchSNP({
          rsId: this.rsId.trim() || null,
          chromosome: this.chromosome || null,
          position: this.position || null,
          population: this.population || null,
          page: this.page,
          size: Number(this.size),
          viewAll: this.viewAllMode
        })
        this.results = response.data || []
        this.total = Number(response.total || 0)
        if (this.results.length > 0) {
          await this.selectVariant(this.results[0])
        } else {
          this.selectedVariant = null
        }
      } catch (error) {
        this.results = []
        this.total = 0
        this.selectedVariant = null
        this.errorMessage = (error.response && error.response.data && error.response.data.message) || 'Failed to query SNP data.'
      } finally {
        this.loading = false
      }
    },
    async selectVariant(variant) {
      if (!variant) return
      this.selectedVariant = variant
      this.frequency = null
      this.frequencyError = ''
      const requestId = ++this.frequencyRequestId
      this.frequencyLoading = true
      try {
        const response = await getSnpFrequency({
          id: variant.rsId,
          chromosome: variant.chromosome,
          position: variant.position
        })
        if (requestId === this.frequencyRequestId) this.frequency = response.data
      } catch (error) {
        if (requestId === this.frequencyRequestId) {
          this.frequencyError = (error.response && error.response.data && error.response.data.message) || 'Population frequencies are unavailable for this SNP.'
        }
      } finally {
        if (requestId === this.frequencyRequestId) this.frequencyLoading = false
      }
    },
    isSelected(variant) {
      return Boolean(this.selectedVariant && this.selectedVariant.rsId === variant.rsId && this.selectedVariant.position === variant.position)
    },
    openBrowser(variant) {
      if (this.$refs.frequencyMap) this.$refs.frequencyMap.hideTooltip()
      this.browserVariant = variant
      this.browserVisible = true
    },
    handleReset() {
      this.rsId = ''
      this.chromosome = ''
      this.position = null
      this.population = ''
      this.page = 1
      this.size = 10
      this.clearQueryOutput()
    },
    prevPage() {
      if (this.page > 1) {
        this.page--
        this.runQuery(this.viewAllMode)
      }
    },
    nextPage() {
      if (this.page < this.totalPages) {
        this.page++
        this.runQuery(this.viewAllMode)
      }
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
.snp-query {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.query-form {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
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
  transition: border-color 0.3s;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
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
  background-color: #909399;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 120px;
}

.reset-btn:hover:not(:disabled) {
  background-color: #a6a9ad;
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

.error-message {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #fde2e2;
}

.warning-message {
  padding: 15px;
  border: 1px solid #ebd19d;
  border-radius: 4px;
  background: #fff8e8;
  color: #795515;
}

.results-section {
  margin-top: 30px;
}

.results-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
}

.results-section h3 {
  color: #2b4275;
  margin-bottom: 15px;
}

.pagination-info {
  color: #606266;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.results-table {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
  background: white;
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

.frequency-btn { background: #2f6e9f; }
.frequency-btn:hover { background: #24587f; }
.browser-btn { background: #72558d; }
.browser-btn:hover { background: #5d4475; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.page-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.page-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.page-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.page-info {
  color: #606266;
  font-weight: 500;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 1.1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
  .results-header { align-items: flex-start; flex-direction: column; gap: 0; }
}
</style>
