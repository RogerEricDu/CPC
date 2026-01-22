<template>
  <div class="database-container">
    <!-- 高级 Header -->
    <div class="advanced-header">
      <div class="header-background">
        <div class="header-content">
          <div class="header-main">
            <h1 class="header-title">
              <span class="title-gradient">Database Portal</span>
            </h1>
            <p class="header-subtitle">Chinese Pangenome Consortium</p>
            <div class="header-description">
              Explore comprehensive genomic data including SNP, Structural Variations, 
              and advanced imputation tools for population genetics research.
            </div>
          </div>
          <div class="header-graphic">
            <div class="dna-animation">
              <div class="dna-strand">
                <div class="nucleotide" v-for="n in 12" :key="n" :style="{
                  animationDelay: `${n * 0.2}s`
                }"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="header-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" class="shape-fill"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="shape-fill"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="shape-fill"></path>
          </svg>
        </div>
      </div>
    </div>
    
    <!-- 导航标签 -->
    <div class="database-nav">
      <button 
        class="nav-btn" 
        :class="{ active: activeTab === 'snp' }"
        @click="activeTab = 'snp'"
      >
        <i class="nav-icon">🧬</i>
        SNP Query
      </button>
      <button 
        class="nav-btn" 
        :class="{ active: activeTab === 'sv' }"
        @click="activeTab = 'sv'"
      >
        <i class="nav-icon">🧬</i>
        SV Query
      </button>
      <button 
        class="nav-btn" 
        :class="{ active: activeTab === 'imputation' }"
        @click="activeTab = 'imputation'"
      >
        <i class="nav-icon">🔀</i>
        Imputation
      </button>
      <button 
        class="nav-btn" 
        :class="{ active: activeTab === 'pangraph' }"
        @click="activeTab = 'pangraph'"
      >
        <i class="nav-icon">🔀</i>
        PanGraph
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="database-content">
      <SNPQuery v-if="activeTab === 'snp'" />
      <SVQuery v-if="activeTab === 'sv'" />
      <ImputationTool v-if="activeTab === 'imputation'" />
    </div>
  </div>
</template>

<script>
import SNPQuery from './SNPQuery.vue'
import SVQuery from './SVQuery.vue'
import ImputationTool from './ImputationTool.vue'
import Pangraph from './Pangraph.vue';

export default {
  name: 'Database',
  components: {
    SNPQuery,
    SVQuery,
    ImputationTool,
    Pangraph
  },
  data() {
    return {
      activeTab: 'snp'
    }
  }
}
</script>

<style scoped>
.database-container {
  min-height: 600px;
}

/* 高级 Header 样式 */
.advanced-header {
  position: relative;
  margin: 20px 20px 30px 20px;
  overflow: hidden;
}

.header-background {
  background: linear-gradient(135deg, 
    #667eea 0%, 
    #764ba2 33%, 
    #1b6021 66%, 
    #4facfe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  position: relative;
  padding: 80px 20px 120px 20px;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  align-items: center;
}

.header-main {
  color: white;
}

.header-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.1;
}

.title-gradient {
  background: linear-gradient(135deg, 
    #ffffff 0%, 
    #f8f9fa 50%, 
    #e9ecef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 20px;
  opacity: 0.9;
  color: #e9ecef;
}

.header-description {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.8;
  max-width: 1000px;
  margin-bottom: 30px;
}

/* DNA 动画 */
.header-graphic {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dna-animation {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dna-strand {
  position: relative;
  width: 4px;
  height: 120px;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    rgba(255, 255, 255, 0.8) 50%, 
    transparent 100%);
  animation: strandFloat 3s ease-in-out infinite;
}

@keyframes strandFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}

.nucleotide {
  position: absolute;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  left: 50%;
  transform: translateX(-50%);
  animation: nucleotideGlow 2s ease-in-out infinite;
}

.nucleotide:nth-child(odd) {
  background: rgba(255, 255, 255, 0.7);
}

@keyframes nucleotideGlow {
  0%, 100% { 
    opacity: 0.7; 
    transform: translateX(-50%) scale(1);
  }
  50% { 
    opacity: 1; 
    transform: translateX(-50%) scale(1.2);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
  }
}

/* 波浪形状 */
.header-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;
}

.header-wave svg {
  position: relative;
  display: block;
  width: calc(100% + 1.3px);
  height: 80px;
}

.shape-fill {
  fill: #ffffff;
}

/* 导航标签样式优化 */
.database-nav {
  display: flex;
  justify-content: center;
  margin: 20px auto 40px auto;
  max-width: 1000px;
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.1),
    0 2px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.nav-btn {
  padding: 16px 32px;
  margin: 0 8px;
  border: none;
  background: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: #606266;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.nav-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.4), 
    transparent);
  transition: left 0.5s ease;
}

.nav-btn:hover::before {
  left: 100%;
}

.nav-btn:hover {
  color: var(--main-color);
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-2px);
}

.nav-btn.active {
  color: white;
  background: linear-gradient(135deg, var(--main-color), #667eea);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.database-content {
  min-height: 400px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 30px;
  }
  
  .header-title {
    font-size: 2.5rem;
  }
  
  .header-subtitle {
    font-size: 1.2rem;
  }
  
  .dna-animation {
    width: 150px;
    height: 150px;
  }
  
  .database-nav {
    flex-direction: column;
    gap: 10px;
    margin: -60px 20px 40px 20px;
  }
  
  .nav-btn {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 2rem;
  }
  
  .header-subtitle {
    font-size: 1.1rem;
  }
  
  .header-description {
    font-size: 1rem;
  }
  
  .dna-animation {
    width: 120px;
    height: 120px;
  }
}
</style>