<template>
  <div class="sv-query">
    <div class="query-form">
      
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

      <div class="form-row">
        <div class="form-group">
          <label for="svChromosome">Chromosome:</label>
          <select id="svChromosome" v-model="queryParams.chromosome" class="form-select">
            <option value="">Select Chromosome</option>
            <option v-for="chr in chromosomes" :key="chr" :value="chr">
              {{ chr }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="uniqueId">SV ID:</label>
          <input 
            type="text" 
            id="uniqueId"
            v-model="queryParams.uniqueId"
            placeholder="e.g., SV_001"
            class="form-input"
          >
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
        <label for="population">Population:</label>
        <select id="population" v-model="queryParams.population" class="form-select">
          <option value="">All Populations</option>
          <option value="han">Han Chinese</option>
          <option value="zang">Tibetan</option>
          <option value="miao">Miao</option>
          <option value="mongolian">Mongolian</option>
          <option value="southern">Southern Groups</option>
          <option value="northern">Northern Groups</option>
        </select>
      </div>

      <div class="form-actions">
        <button @click="handleReset" class="reset-btn">
          Reset
        </button>
        <button @click="handleQuery" :disabled="loading" class="query-btn">
          {{ loading ? 'Searching...' : 'Search SV' }}
        </button>
      </div>
    </div>

    <!-- 结果展示 -->
    <div v-if="results" class="results-section">
      <div class="results-header">
        <h3>SV Query Results</h3>
        <div class="results-info">
          Total: {{ total }} records
        </div>
      </div>

      <!-- 分页控件 -->
      <div class="pagination" v-if="total > 0">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
      </div>

      <div class="results-table" v-if="results.length > 0">
        <table>
          <thead>
            <tr>
              <th>SV ID</th>
              <th>Type</th>
              <th>Chromosome</th>
              <th>Start</th>
              <th>End</th>
              <th>Size (bp)</th>
              <th>Population</th>
              <th>Allele Frequency</th>
              <th>Sequence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results" :key="result.svId">
              <td>{{ result.uniqueId || 'N/A' }}</td>
              <td>
                <span class="sv-type" :class="result.SVType ? result.SVType.toLowerCase() : ''">
                  {{ result.SVType || 'N/A' }}
                </span>
              </td>
              <td>{{ result.chromosome || 'N/A' }}</td>
              <td>{{ result.start ? result.start.toLocaleString() : 'N/A' }}</td>
              <td>{{ result.end ? result.end.toLocaleString() : 'N/A' }}</td>
              <td>{{ calculateSize(result) }}</td>
              <td>{{ result.population || 'N/A' }}</td>
              <td>{{ result.alleleFrequency ? result.alleleFrequency.toFixed(4) : 'N/A' }}</td>
              <td class="sequence-cell">
                <span v-if="result.sequence" :title="result.sequence">
                  {{ truncateSequence(result.sequence) }}
                </span>
                <span v-else>N/A</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-results">
        <p>No results found</p>
      </div>

      <!-- 分页控件 -->
      <div class="pagination" v-if="total > 0">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { searchSV } from '@/api/variant'

export default {
  name: 'SVQuery',
  data() {
    return {
      queryParams: {
        chromosome: '',
        start: null,
        end: null,
        uniqueId: '',
        population: '',
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
      chromosomes: Array.from({length: 22}, (_, i) => `chr${i + 1}`).concat(['chrX', 'chrY'])
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.pageSize)
    }
  },
  methods: {
    async handleQuery() {
      this.loading = true
      this.error = null
      
      try {
        // 构建查询参数
        const params = {
          ...this.queryParams,
          page: this.currentPage,
          size: this.pageSize
        }

        // 清理空参数
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null) {
            delete params[key]
          }
        })

        const response = await searchSV(params)
        
        this.results = response.data || []
        this.total = response.total || 0
        
        if (this.results.length === 0) {
          this.error = 'No results found for the given criteria.'
        }
      } catch (err) {
        console.error('SV query error:', err)
        this.error = 'Failed to search SV data. Please try again.'
        this.results = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    handleReset() {
      this.queryParams = {
        chromosome: '',
        start: null,
        end: null,
        uniqueId: '',
        population: '',
        SVType: '',
        page: 1,
        size: 10
      }
      this.results = null
      this.currentPage = 1
      this.error = null
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.handleQuery()
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.handleQuery()
      }
    },

    calculateSize(sv) {
      if (sv.start && sv.end) {
        return (sv.end - sv.start + 1).toLocaleString()
      }
      return 'N/A'
    },

    truncateSequence(sequence, maxLength = 20) {
      if (!sequence) return 'N/A'
      if (sequence.length <= maxLength) return sequence
      return sequence.substring(0, maxLength) + '...'
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--main-color);
  color: var(--main-color);
}

.page-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.page-info {
  color: #606266;
  font-weight: 500;
}

.results-table {
  overflow-x: auto;
  margin: 20px 0;
}

table {
  width: 100%;
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

.sv-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.sv-type.del {
  background-color: #ffebee;
  color: #c62828;
}

.sv-type.dup {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.sv-type.ins {
  background-color: #e3f2fd;
  color: #1565c0;
}

.sv-type.inv {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.sv-type.bnd {
  background-color: #fff3e0;
  color: #ef6c00;
}

.sequence-cell {
  max-width: 200px;
  word-break: break-all;
}

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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .results-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
}
</style>