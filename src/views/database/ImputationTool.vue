<template>
  <div class="imputation-tool">
    <div class="tool-header">
      <p>Genotype imputation using Chinese Pangenome Reference Panel</p>
    </div>

    <div class="upload-section">
      <div class="upload-area" @drop="handleDrop" @dragover="handleDragOver">
        <div class="upload-content">
          <i class="upload-icon">📁</i>
          <h3>Upload VCF File</h3>
          <p>Drag & drop your VCF file here or click to browse</p>
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileSelect"
            accept=".vcf,.vcf.gz"
            hidden
          >
          <button @click="triggerFileInput" class="browse-btn">
            Browse Files
          </button>
        </div>
      </div>

      <div v-if="selectedFile" class="file-info">
        <div class="file-details">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          <button @click="removeFile" class="remove-btn">×</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>Imputation Settings</h3>
      
      <div class="settings-grid">
        <div class="setting-group">
          <label>Reference Panel:</label>
          <select v-model="referencePanel" class="form-select">
            <option value="cprp_v1">CPRP v1.0 (Chinese Pangenome Reference Panel)</option>
            <option value="cprp_v2">CPRP v2.0 (Extended Panel)</option>
          </select>
        </div>

        <div class="setting-group">
          <label>Population Group:</label>
          <select v-model="populationGroup" class="form-select">
            <option value="all">All Chinese Populations</option>
            <option value="han">Han Chinese</option>
            <option value="southern">Southern Ethnic Groups</option>
            <option value="northern">Northern Ethnic Groups</option>
          </select>
        </div>

        <div class="setting-group">
          <label>Quality Threshold:</label>
          <input 
            type="range" 
            v-model.number="qualityThreshold"
            min="0.5"
            max="1.0"
            step="0.05"
            class="quality-slider"
          >
          <span class="threshold-value">{{ qualityThreshold }}</span>
        </div>

        <div class="setting-group">
          <label>Output Format:</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="outputFormat" value="vcf"> VCF
            </label>
            <label class="radio-label">
              <input type="radio" v-model="outputFormat" value="plink"> PLINK
            </label>
            <label class="radio-label">
              <input type="radio" v-model="outputFormat" value="both"> Both
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="action-section">
      <button 
        @click="runImputation" 
        :disabled="!selectedFile || running"
        class="run-btn"
      >
        {{ running ? 'Running Imputation...' : 'Run Imputation' }}
      </button>
      
      <button 
        v-if="results"
        @click="downloadResults"
        class="download-btn"
      >
        Download Results
      </button>
    </div>

    <div v-if="results" class="results-section">
      <h3>Imputation Results</h3>
      <div class="results-stats">
        <div class="stat-item">
          <span class="stat-label">Imputed SNPs:</span>
          <span class="stat-value">{{ results.imputedSnps.toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average Quality Score:</span>
          <span class="stat-value">{{ results.avgQuality }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Completion Rate:</span>
          <span class="stat-value">{{ results.completionRate }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImputationTool',
  data() {
    return {
      selectedFile: null,
      referencePanel: 'cprp_v1',
      populationGroup: 'all',
      qualityThreshold: 0.8,
      outputFormat: 'vcf',
      running: false,
      results: null
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedFile = file
      }
    },
    
    handleDragOver(event) {
      event.preventDefault()
    },
    
    handleDrop(event) {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file && (file.name.endsWith('.vcf') || file.name.endsWith('.vcf.gz'))) {
        this.selectedFile = file
      }
    },
    
    removeFile() {
      this.selectedFile = null
      this.$refs.fileInput.value = ''
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    async runImputation() {
      this.running = true
      
      // 模拟运行过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      this.results = {
        imputedSnps: 1250000,
        avgQuality: '0.92',
        completionRate: '98.5%'
      }
      
      this.running = false
    },
    
    downloadResults() {
      // 模拟下载功能
      alert('Download functionality would be implemented here')
    }
  }
}
</script>

<style scoped>
.imputation-tool {
  max-width: 1000px;
  margin: 0 auto;
}

.tool-header {
  text-align: center;
  margin-bottom: 30px;
}

.tool-header h2 {
  color: #2b4275;
  margin-bottom: 10px;
}

.tool-header p {
  color: #606266;
  font-size: 1.1rem;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafbfc;
}

.upload-area:hover {
  border-color: var(--main-color);
  background-color: #f5f7fa;
}

.upload-content .upload-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  display: block;
}

.upload-content h3 {
  color: #2b4275;
  margin-bottom: 10px;
}

.upload-content p {
  color: #606266;
  margin-bottom: 20px;
}

.browse-btn {
  background-color: var(--main-color);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.browse-btn:hover {
  background-color: #e67e00;
}

.file-info {
  margin-top: 15px;
}

.file-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #e8f5e8;
  padding: 10px 15px;
  border-radius: 6px;
}

.file-name {
  font-weight: 500;
  color: #2e7d32;
}

.file-size {
  color: #606266;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #f44336;
  padding: 0 5px;
}

.settings-section {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.settings-section h3 {
  color: #2b4275;
  margin-bottom: 20px;
  text-align: center;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-weight: 500;
  color: #606266;
}

.quality-slider {
  width: 100%;
}

.threshold-value {
  text-align: center;
  font-weight: 500;
  color: var(--main-color);
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.action-section {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.run-btn, .download-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.run-btn {
  background-color: var(--main-color);
  color: white;
}

.run-btn:hover:not(:disabled) {
  background-color: #e67e00;
}

.run-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.download-btn {
  background-color: #28a745;
  color: white;
}

.download-btn:hover {
  background-color: #218838;
}

.results-section h3 {
  color: #2b4275;
  margin-bottom: 20px;
  text-align: center;
}

.results-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-label {
  display: block;
  color: #606266;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.stat-value {
  display: block;
  color: #2b4275;
  font-size: 1.5rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .results-stats {
    grid-template-columns: 1fr;
  }
  
  .action-section {
    flex-direction: column;
  }
}
</style>