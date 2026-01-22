<!-- <template>

<div v-if="!isAuthenticated" class="password-auth">

</div>
  

<div v-else style="max-width: 2400px; margin: 10 auto;">

  <div style="position: absolute; top: 20px; right: 20px; z-index: 1000;">
    <button @click="logout" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
      Logout
    </button>
  </div>
  
  <div class="cover-color" style="margin: 10 10% 10px;">
    <div style="font-size: 25px;font-weight: 600;margin-bottom: 20px; margin-top: 20px;">
      CPC Pangenome Browser - FASTA Viewer
    </div>
    <div style="font-size: 19px;font-weight: 500;margin-bottom: 40px;text-align: left">
      This browser displays FASTA sequences from CPC Phase II samples.
      <br>Currently showing <strong>{{ totalAssemblies }}</strong> assemblies.
      <span v-if="filteredAssemblies.length < totalAssemblies" style="color: #666; font-size: 16px;">
        (Filtered: {{ filteredAssemblies.length }})
      </span>
    </div>
    

    <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 15px;">

        <div style="flex: 1; min-width: 300px;">
          <div style="position: relative;">
            <input
              v-model="searchQuery"
              @input="filterAssemblies"
              type="text"
              placeholder="Search assemblies (e.g. CPCERZ200001_1 or 200001)"
              style="width: 100%; padding: 10px 15px 10px 40px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
            />
            <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;">
              🔍
            </div>
          </div>
        </div>
        

        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="font-weight: 500; color: #666;">File Type:</span>
          <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
            <input type="checkbox" v-model="showType1" @change="filterAssemblies" style="cursor: pointer;">
            <span>.1 files</span>
          </label>
          <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
            <input type="checkbox" v-model="showType2" @change="filterAssemblies" style="cursor: pointer;">
            <span>.2 files</span>
          </label>
        </div>
      </div>
    </div>
    

    <div style="margin-bottom: 20px; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
        <span style="font-weight: 500; color: #666;">Select Assembly:</span>
        <select 
          v-model="selectedAssembly" 
          @change="changeAssembly" 
          style="padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; min-width: 250px; font-size: 14px; background: white; cursor: pointer;"
        >
          <option v-for="assembly in filteredAssemblies" :key="assembly.name" :value="assembly.name">
            {{ formatAssemblyName(assembly.name) }}
          </option>
        </select>
        <span style="color: #5979c2; font-size: 14px; font-weight: 500;">
          Showing: {{ formatAssemblyName(selectedAssembly) }}
        </span>
        <span style="color: #666; font-size: 13px; margin-left: auto;">
          {{ currentIndex + 1 }} / {{ filteredAssemblies.length }}
        </span>
      </div>
      

      <div style="display: flex; gap: 10px; margin-top: 15px;">
        <button 
          @click="navigate(-1)"
          :disabled="currentIndex === 0"
          style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 13px;"
          :style="{ opacity: currentIndex === 0 ? 0.5 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }"
        >
          ← Previous
        </button>
        <button 
          @click="navigate(1)"
          :disabled="currentIndex === filteredAssemblies.length - 1"
          style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 13px;"
          :style="{ opacity: currentIndex === filteredAssemblies.length - 1 ? 0.5 : 1, cursor: currentIndex === filteredAssemblies.length - 1 ? 'not-allowed' : 'pointer' }"
        >
          Next →
        </button>
      </div>
    </div>
    

    <div ref="jbrowse" style="width: 100%; min-height: 800px; border: 1px solid #e0e0e0; border-radius: 8px;"></div>
  </div>
</div>
</template> -->

<!-- <script>
// 【关键】在组件外静态导入所有依赖
import assemblies from '@/assemblies'
import tracks from '@/tracks'
import { createViewState, JBrowseApp } from '@jbrowse/react-app'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

// 【关键】创建静态配置对象（完全在Vue响应式系统之外）
const STATIC_CONFIG = Object.freeze({
  configuration: {
    theme: {
      typography: {
        fontSize: 13.5
      },
      spacing: 10,
      palette: {
        primary: {
          main: '#5979c2',
        },
        secondary: {
          main: '#20386e',
        }
      }
    }
  },
  assemblies: assemblies,
  tracks: tracks,
  connections: [],
})

export default {
  name: 'CPCJBrowse',
  
  data() {
    return {
      // 认证相关
      isAuthenticated: false,
      accessKey: '',
      authError: '',
      validAccessKey: 'CPC2024_Genome_Viewer_Access',
      
      // UI状态
      searchQuery: '',
      showType1: true,
      showType2: true,
      filteredAssemblies: [],
      selectedAssembly: '',
      
      // React实例引用
      reactRoot: null
    }
  },
  
  computed: {
    totalAssemblies() {
      return assemblies.length
    },
    
    currentAssembly() {
      if (!this.selectedAssembly && this.filteredAssemblies.length > 0) {
        return this.filteredAssemblies[0]
      }
      return assemblies.find(a => a.name === this.selectedAssembly) || 
             this.filteredAssemblies[0] || 
             assemblies[0]
    },
    
    currentIndex() {
      return this.filteredAssemblies.findIndex(a => a.name === this.selectedAssembly)
    }
  },
  
  methods: {
    // 认证方法
    checkAccessKey() {
      if (this.accessKey === this.validAccessKey) {
        this.isAuthenticated = true
        this.authError = ''
        sessionStorage.setItem('cpc_authenticated', 'true')
        this.$nextTick(() => {
          this.initJBrowse()
        })
      } else {
        this.authError = 'Invalid access key. Please try again.'
        this.accessKey = ''
      }
    },
    
    logout() {
      this.isAuthenticated = false
      this.accessKey = ''
      sessionStorage.removeItem('cpc_authenticated')
      this.cleanupJBrowse()
    },
    
    checkExistingAuth() {
      const authenticated = sessionStorage.getItem('cpc_authenticated')
      if (authenticated === 'true') {
        this.isAuthenticated = true
        this.$nextTick(() => {
          this.initJBrowse()
        })
      }
    },
    
    // 格式化显示名称
    formatAssemblyName(name) {
      const match = name.match(/^(CPCERZ200\d{3})_([12])$/)
      if (match) {
        return `${match[1]}.${match[2]}`
      }
      return name
    },
    
    // 过滤assemblies
    filterAssemblies() {
      let filtered = [...assemblies]
      
      // 按文件类型过滤
      if (!this.showType1 || !this.showType2) {
        filtered = filtered.filter(assembly => {
          if (this.showType1 && assembly.name.endsWith('_1')) return true
          if (this.showType2 && assembly.name.endsWith('_2')) return true
          return false
        })
      }
      
      // 按搜索词过滤
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim()
        filtered = filtered.filter(assembly => {
          const displayName = this.formatAssemblyName(assembly.name).toLowerCase()
          return displayName.includes(query) || 
                 assembly.name.toLowerCase().includes(query) ||
                 assembly.name.replace('_', '').toLowerCase().includes(query.replace('_', ''))
        })
      }
      
      this.filteredAssemblies = filtered
      
      // 如果当前选中的assembly不在过滤结果中，选择第一个
      if (!this.filteredAssemblies.some(a => a.name === this.selectedAssembly) && 
          this.filteredAssemblies.length > 0) {
        this.selectedAssembly = this.filteredAssemblies[0].name
        this.$nextTick(() => {
          this.changeAssembly()
        })
      }
    },
    
    // 导航
    navigate(direction) {
      const newIndex = this.currentIndex + direction
      if (newIndex >= 0 && newIndex < this.filteredAssemblies.length) {
        this.selectedAssembly = this.filteredAssemblies[newIndex].name
        this.changeAssembly()
      }
    },
    
    // 获取refName
    getFirstRefName(assemblyName) {
      if (assemblyName === 'CPCERZ200001_1') return 'CPCERZ200001.1'
      if (assemblyName === 'CPCERZ200001_2') return 'CPCERZ200001.2'
      
      const match = assemblyName.match(/^(CPCERZ200\d{3})_([12])$/)
      if (match) return `${match[1]}.${match[2]}`
      
      return 'CPCERZ200001.1'
    },
    
    // 【关键】获取session配置
    getSessionConfig() {
      const assembly = this.currentAssembly
      if (!assembly) return { name: 'CPC FASTA Viewer', views: [] }
      
      const assemblyName = assembly.name
      const trackId = assembly.sequence?.trackId || `${assemblyName}-ReferenceSequenceTrack`
      const refName = this.getFirstRefName(assemblyName)
      
      // 返回纯对象（不要用Object.freeze，让MST自己处理）
      return {
        name: `CPC FASTA Viewer - ${this.formatAssemblyName(assemblyName)}`,
        views: [
          {
            id: 'fasta_viewer',
            type: 'LinearGenomeView',
            offsetPx: 0,
            bpPerPx: 100,
            displayedRegions: [
              {
                refName: refName,
                start: 0,
                end: 10000,
                assemblyName: assemblyName,
              },
            ],
            tracks: [
              {
                type: "ReferenceSequenceTrack",
                configuration: trackId,
                displays: [
                  {
                    type: "LinearReferenceSequenceDisplay",
                    height: 200,
                    configuration: `${trackId}-LinearReferenceSequenceDisplay`,
                  },
                ],
              },
            ],
            trackSelectorType: "hierarchical",
          }
        ],
        widgets: {
          hierarchicalTrackSelector: {
            id: "hierarchicalTrackSelector",
            type: "HierarchicalTrackSelectorWidget",
            view: "fasta_viewer",
          }
        },
        activeWidgets: {
          hierarchicalTrackSelector: "hierarchicalTrackSelector",
        },
      }
    },
    
    // 【关键】清理JBrowse
    cleanupJBrowse() {
      if (this.reactRoot) {
        try {
          this.reactRoot.unmount()
        } catch (e) {
          console.warn('Error during unmount:', e)
        }
        this.reactRoot = null
      }
      
      const container = this.$refs.jbrowse
      if (container) {
        container.innerHTML = ''
      }
    },
    
    // 【关键】渲染JBrowse - 完全同步，类似第一个组件
    renderJBrowse() {
      try {
        console.log('Rendering JBrowse...')
        
        // 清理之前的实例
        this.cleanupJBrowse()
        
        const container = this.$refs.jbrowse
        if (!container) {
          console.error('JBrowse container not found')
          return
        }
        
        // 创建完整的配置对象
        const fullConfig = {
          ...STATIC_CONFIG,
          defaultSession: this.getSessionConfig()
        }
        
        console.log('Config for JBrowse:', {
          assembly: this.selectedAssembly,
          refName: this.getFirstRefName(this.selectedAssembly),
          configKeys: Object.keys(fullConfig)
        })
        
        // 【关键】使用createRoot而不是ReactDOM.render
        this.reactRoot = ReactDOM.createRoot(container)
        
        // 创建viewState
        const viewState = new createViewState({
          config: fullConfig
        })
        
        // 渲染
        this.reactRoot.render(
          React.createElement(JBrowseApp, { viewState })
        )
        
        console.log('JBrowse rendered successfully')
        
      } catch (error) {
        console.error('Failed to render JBrowse:', error)
        this.showError(error.message)
      }
    },
    
    changeAssembly() {
      console.log(`Changing to assembly: ${this.selectedAssembly}`)
      this.renderJBrowse()
    },
    
    showError(message) {
      const container = this.$refs.jbrowse
      if (container) {
        container.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #d32f2f; background: #ffebee; border-radius: 8px;">
            <h3 style="margin-bottom: 20px;">Failed to load FASTA viewer</h3>
            <p style="margin-bottom: 20px; font-family: monospace;">${message}</p>
            <button @click="renderJBrowse" style="padding: 10px 20px; background: #5979c2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Retry
            </button>
          </div>
        `
      }
    },
    
    initJBrowse() {
      console.log('Initializing JBrowse...')
      
      // 初始化过滤
      this.filterAssemblies()
      
      // 设置默认选中的assembly
      if (this.filteredAssemblies.length > 0) {
        this.selectedAssembly = this.filteredAssemblies[0].name
      } else if (assemblies.length > 0) {
        this.selectedAssembly = assemblies[0].name
      }
      
      console.log('Initial assembly:', this.selectedAssembly)
      
      // 立即渲染
      this.$nextTick(() => {
        this.renderJBrowse()
      })
    }
  },
  
  mounted() {
    console.log('Component mounted')
    this.checkExistingAuth()
  },
  
  beforeDestroy() {
    console.log('Component destroying')
    this.cleanupJBrowse()
  }
}
</script> -->
<!-- <style scoped>
/* 原有的认证页面样式保持不变 */
.password-auth {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.auth-box {
  background: white;
  border-radius: 20px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.08),
    0 2px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  border: 1px solid rgba(89, 121, 194, 0.1);
}

/* 品牌标识 */
.auth-brand {
  padding: 30px 30px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: linear-gradient(to right, #5979c2, #20386e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-logo {
  font-size: 36px;
  line-height: 1;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
  margin-top: 2px;
}

/* 头部 */
.auth-header {
  padding: 0 30px 25px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.auth-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.auth-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.5;
}

/* 错误提示 */
.auth-error {
  background: linear-gradient(to right, #fff5f5, #fff);
  color: #e53e3e;
  padding: 14px 20px;
  margin: 20px 30px;
  border-radius: 12px;
  font-size: 13px;
  border: 1px solid #fed7d7;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.3s ease;
}

.error-icon {
  font-size: 16px;
}

/* 表单 */
.auth-form {
  padding: 30px;
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.auth-input {
  width: 100%;
  padding: 16px 20px 16px 50px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #2d3748;
  background: #f8fafc;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.auth-input:focus {
  outline: none;
  border-color: #5979c2;
  background: white;
  box-shadow: 
    0 0 0 3px rgba(89, 121, 194, 0.1),
    0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.auth-input::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.input-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #718096;
  pointer-events: none;
}

.auth-button {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #5979c2 0%, #20386e 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 20px;
}

.auth-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 10px 25px -5px rgba(89, 121, 194, 0.4),
    0 20px 40px -10px rgba(89, 121, 194, 0.3);
}

.auth-button:active {
  transform: translateY(0);
}

.button-text {
  letter-spacing: 0.3px;
}

.button-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.auth-button:hover .button-icon {
  transform: translateX(4px);
}

.auth-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #718096;
  font-size: 13px;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #edf2f7;
}

.hint-icon {
  font-size: 14px;
}

.hint-text {
  font-weight: 500;
}

/* 页脚 */
.auth-footer {
  padding: 25px 30px;
  background: #f8fafc;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.footer-content {
  text-align: center;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.footer-link {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #5979c2;
  cursor: default;
}

.footer-separator {
  color: #cbd5e0;
  font-size: 10px;
}

.footer-copyright {
  font-size: 11px;
  color: #a0aec0;
  letter-spacing: 0.3px;
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-animation {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .auth-container {
    padding: 15px;
  }
  
  .auth-box {
    border-radius: 16px;
  }
  
  .auth-brand {
    padding: 25px 25px 15px;
  }
  
  .brand-logo {
    font-size: 32px;
  }
  
  .brand-title {
    font-size: 20px;
  }
  
  .brand-subtitle {
    font-size: 13px;
  }
  
  .auth-header,
  .auth-form,
  .auth-error,
  .auth-footer {
    padding-left: 25px;
    padding-right: 25px;
  }
  
  .auth-title {
    font-size: 18px;
  }
  
  .auth-subtitle {
    font-size: 13px;
  }
  
  .auth-input {
    padding: 14px 20px 14px 45px;
    font-size: 14px;
  }
  
  .auth-button {
    padding: 14px 20px;
    font-size: 14px;
  }
}
</style> -->