<template>
  <div class="snp-query">
    <div class="query-form">
      <div class="form-group">
        <label for="snpId">SNP ID (rsID):</label>
        <input 
          type="text" 
          id="snpId"
          v-model="snpId"
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
      
      <button @click="handleQuery" class="query-btn">
        Query SNP
      </button>
    </div>

    <!-- 结果展示 -->
    <div v-if="results" class="results-section">
      <h3>Query Results</h3>
      <div class="results-table">
        <table>
          <thead>
            <tr>
              <th>SNP ID</th>
              <th>Chromosome</th>
              <th>Position</th>
              <th>Reference</th>
              <th>Alternative</th>
              <th>MAF</th>
              <th>Population</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results" :key="result.id">
              <td>{{ result.id }}</td>
              <td>{{ result.chr }}</td>
              <td>{{ result.pos.toLocaleString() }}</td>
              <td>{{ result.ref }}</td>
              <td>{{ result.alt }}</td>
              <td>{{ result.maf }}</td>
              <td>{{ result.population }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SNPQuery',
  data() {
    return {
      snpId: '',
      chromosome: '',
      position: null,
      population: '',
      results: null,
      chromosomes: Array.from({length: 22}, (_, i) => `chr${i + 1}`).concat(['chrX', 'chrY', 'chrM'])
    }
  },
  methods: {
    handleQuery() {
      // 模拟查询结果
      this.results = [{
        id: this.snpId || 'rs123456',
        chr: this.chromosome || 'chr1',
        pos: this.position || 1234567,
        ref: 'A',
        alt: 'G',
        maf: '0.23',
        population: this.population || 'Han Chinese'
      }]
    }
  }
}
</script>

<style scoped>
.snp-query {
  max-width: 1000px;
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
  display: block;
  margin: 20px auto 0;
}

.query-btn:hover {
  background-color: #e67e00;
}

.results-section {
  margin-top: 30px;
}

.results-section h3 {
  color: #2b4275;
  margin-bottom: 15px;
}

.results-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
}

tr:hover {
  background-color: #f5f7fa;
}
</style>