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
        <button @click="handleQuery" class="query-btn" :disabled="loading">
          {{ loading ? 'Querying...' : 'Query SNP' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading data...</span>
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- 结果展示 -->
    <div v-if="results && results.length > 0" class="results-section">
      <h3>Query Results (Total: {{ total }})</h3>
      <div class="pagination-info">
        Page {{ page }} of {{ Math.ceil(total / size) }}
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
              <th>MAF</th>
              <th>Population</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results" :key="result.snpId">
              <td>{{ result.rsId || 'N/A' }}</td>
              <td>chr{{ result.chromosome }}</td>
              <td>{{ result.position.toLocaleString() }}</td>
              <td>{{ result.ref_allele }}</td>
              <td>{{ result.alt_allele }}</td>
              <td>{{ (result.ref_frequency * 100).toFixed(2) }}%</td>
              <td>{{ (result.alt_frequency * 100).toFixed(2) }}%</td>
              <td>{{ (Math.min(result.ref_frequency, result.alt_frequency) * 100).toFixed(2) }}%</td>
              <td>{{ formatPopulation(result.population) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div v-if="total > size" class="pagination">
        <button 
          @click="prevPage" 
          :disabled="page <= 1"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info">Page {{ page }}</span>
        <button 
          @click="nextPage" 
          :disabled="page >= Math.ceil(total / size)"
          class="page-btn"
        >
          Next
        </button>
      </div>
    </div>
    
    <!-- 无结果 -->
    <div v-if="searched && (!results || results.length === 0)" class="no-results">
      No SNPs found matching your criteria.
    </div>
  </div>
</template>

<script>
import { searchSNP } from '@/api/variant.js'

export default {
  name: 'SNPQuery',
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
      chromosomes: Array.from({length: 22}, (_, i) => (i + 1).toString()).concat(['X', 'Y', 'M'])
    }
  },
  methods: {
    formatPopulation(pop) {
      const popMap = {
        'han': 'Han Chinese',
        'zang': 'Tibetan',
        'miao': 'Miao',
        'mongolian': 'Mongolian'
      }
      return popMap[pop] || pop
    },
    
    async handleQuery() {
      if (this.loading) return
      
      // 重置状态
      this.loading = true
      this.errorMessage = ''
      this.searched = true
      
      // 准备查询参数
      const queryParams = {
        rsId: this.rsId || null,
        chromosome: this.chromosome || null,
        position: this.position || null,
        population: this.population || null,
        page: this.page,
        size: this.size
      }
      
      try {
        const response = await searchSNP(queryParams)
        
        if (response && response.data) {
          this.results = response.data
          this.total = response.total || 0
        } else {
          this.results = []
          this.total = 0
        }
      } catch (error) {
        console.error('Query error:', error)
        this.errorMessage = error.message || 'Failed to query SNP data'
        this.results = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    
    handleReset() {
      this.rsId = ''
      this.chromosome = ''
      this.position = null
      this.population = ''
      this.page = 1
      this.size = 10
      this.results = null
      this.total = 0
      this.errorMessage = ''
      this.searched = false
    },
    
    prevPage() {
      if (this.page > 1) {
        this.page--
        this.handleQuery()
      }
    },
    
    nextPage() {
      if (this.page < Math.ceil(this.total / this.size)) {
        this.page++
        this.handleQuery()
      }
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

.results-section {
  margin-top: 30px;
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
</style>