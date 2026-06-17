<template>
  <div class="data-page">
    <section class="public-section">
      <h2>Code Availability</h2>
      <p>
        All the codes needed to reproduce the results from this work can be found on GitHub,
        <a href="https://github.com/orgs/Shuhua-Group/repositories" target="_blank">https://github.com/orgs/Shuhua-Group/repositories</a>.
      </p>
    </section>

    <AuthRequiredOverlay
      :allowed="canAccessPhase2"
      locked-text="需要登录并申请访问"
      :action-text="phase2ActionText"
      @action="handlePhase2Action"
    >
      <template #preview>
        <section class="data-section preview-section">
          <h2>The CPC Phase II Data Availability</h2>
          <p>
            The release of the CPC Phase II data has been approved by the National Health Commission of the People's Republic of China
            (No. 2025BAT01059). CPC2 assemblies, summary data and detailed information are available through CPC-controlled access.
          </p>
          <p>
            The near T2T CPC.Ref2 comprises 948 haplotype-resolved assemblies from 474 individuals representing
            60 ethnolinguistic groups across China.
          </p>
          <div class="preview-list">
            <span>CPCERZ200001.1</span>
            <span>CPCERZ200001.2</span>
            <span>CPCERZ200002.1</span>
          </div>
        </section>
      </template>

      <section class="data-section">
        <div class="section-head">
          <div>
            <h2>The CPC Phase II Data Availability</h2>
            <p>
              The release of the CPC Phase II data has been approved by the National Health Commission of the People's Republic of China
              (No. 2025BAT01059). The raw data are available through controlled CPC access.
            </p>
          </div>
          <div class="access-pill">PHASE2</div>
        </div>

        <div class="phase2-tools">
          <input v-model.trim="phase2Search" placeholder="Search samples, e.g. CPCERZ200001">
          <label><input type="checkbox" v-model="showHaplotype1"> .1 files</label>
          <label><input type="checkbox" v-model="showHaplotype2"> .2 files</label>
        </div>

        <p class="muted">Showing {{ filteredPhase2Files.length }} of {{ phase2Files.length }} files</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sample</th>
                <th>Type</th>
                <th>File</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in filteredPhase2Files" :key="file.key">
                <td>{{ file.sampleName }}</td>
                <td>{{ file.fileType }}</td>
                <td>{{ file.name }}</td>
                <td><button @click="download('phase2', file)">Download</button></td>
              </tr>
              <tr v-if="filteredPhase2Files.length === 0">
                <td colspan="4" class="empty">No files match your filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </AuthRequiredOverlay>

    <AuthRequiredOverlay
      :allowed="canAccessPhase1"
      locked-text="需要登录访问"
      :action-text="isLoggedIn ? '刷新权限' : '登录'"
      @action="goLogin"
    >
      <template #preview>
        <section class="data-section preview-section">
          <h2>The CPC Phase I Data Availability</h2>
          <p>
            The release of the CPC Phase I data has been approved by The Ministry of Science and Technology of the People's Republic of China
            (permission no. 2022BAT2392). File downloads require login.
          </p>
          <div class="preview-list">
            <span>CPC pangenome reference</span>
            <span>CPC &amp; HPRC pangenome reference</span>
            <span>Genome annotation files</span>
          </div>
        </section>
      </template>

      <section class="data-section">
        <div class="section-head">
          <div>
            <h2>The CPC Phase I Data Availability</h2>
            <p>
              The release of the CPC Phase I data has been approved by The Ministry of Science and Technology of the People's Republic of China
              (permission no. 2022BAT2392). Download requests are authenticated by the CPC backend.
            </p>
          </div>
          <div class="access-pill">BASIC</div>
        </div>

        <div v-for="group in phase1Groups" :key="group" class="file-group">
          <h3>{{ group }}</h3>
          <ul>
            <li v-for="file in filesByGroup(group)" :key="file.key">
              <span>{{ file.name }}</span>
              <button @click="download('phase1', file)">Download</button>
            </li>
          </ul>
        </div>
      </section>
    </AuthRequiredOverlay>
  </div>
</template>

<script>
import AuthRequiredOverlay from '@/components/AuthRequiredOverlay.vue'
import { applyPhase2 } from '@/api/auth'
import { downloadDataFile, getDataFiles } from '@/api/dataAccess'
import { getCurrentUser, hasBasicAccess, hasPhase2Access, isLoggedIn as authIsLoggedIn, setCurrentUser } from '@/utils/auth'

export default {
  name: 'DataPage',
  components: { AuthRequiredOverlay },
  data() {
    return {
      currentUser: getCurrentUser(),
      phase1Files: [],
      phase2Files: [],
      phase2Search: '',
      showHaplotype1: true,
      showHaplotype2: true,
      loadingFiles: false
    }
  },
  computed: {
    isLoggedIn() {
      return authIsLoggedIn()
    },
    canAccessPhase1() {
      return hasBasicAccess(this.currentUser)
    },
    canAccessPhase2() {
      return hasPhase2Access(this.currentUser)
    },
    phase2ActionText() {
      if (!this.isLoggedIn) return '登录'
      if (this.currentUser && this.currentUser.phase2Status === 'PENDING') return '等待审批'
      return '申请访问'
    },
    phase1Groups() {
      return [...new Set(this.phase1Files.map(file => file.groupName))]
    },
    filteredPhase2Files() {
      const query = this.phase2Search.toLowerCase()
      return this.phase2Files.filter(file => {
        const hapMatch = (this.showHaplotype1 && file.name.includes('.1.')) || (this.showHaplotype2 && file.name.includes('.2.'))
        if (!hapMatch) return false
        if (!query) return true
        return file.name.toLowerCase().includes(query) || (file.sampleName || '').toLowerCase().includes(query)
      })
    }
  },
  created() {
    this.loadFiles()
  },
  mounted() {
    window.addEventListener('cpc-auth-changed', this.handleAuthChanged)
  },
  beforeDestroy() {
    window.removeEventListener('cpc-auth-changed', this.handleAuthChanged)
  },
  methods: {
    async loadFiles() {
      this.loadingFiles = true
      try {
        const response = await getDataFiles()
        this.phase1Files = response.data.phase1.files || []
        this.phase2Files = response.data.phase2.files || []
      } finally {
        this.loadingFiles = false
      }
    },
    filesByGroup(group) {
      return this.phase1Files.filter(file => file.groupName === group)
    },
    async download(phase, file) {
      await downloadDataFile(phase, file.key, file.name)
    },
    goLogin() {
      if (!this.isLoggedIn) {
        this.$router.push('/login?redirect=/data')
      } else {
        this.loadFiles()
      }
    },
    async handlePhase2Action() {
      if (!this.isLoggedIn) {
        this.$router.push('/login?redirect=/data')
        return
      }
      if (this.currentUser && this.currentUser.phase2Status === 'PENDING') {
        return
      }
      const reason = window.prompt('Please describe why you need Phase II access:')
      if (!reason) return
      const response = await applyPhase2({ reason })
      setCurrentUser(response.data)
      this.currentUser = response.data
      await this.loadFiles()
    },
    handleAuthChanged() {
      this.currentUser = getCurrentUser()
      this.loadFiles()
    }
  }
}
</script>

<style scoped>
.data-page {
  padding: 0 10px 28px;
}

.public-section,
.data-section {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.data-section {
  border-left: 4px solid #5979c2;
}

h2,
h3 {
  color: #2b4275;
}

p,
.muted {
  color: #606266;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.access-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef3ff;
  color: #2b4275;
  font-weight: 700;
}

.preview-section {
  min-height: 210px;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.preview-list span {
  padding: 6px 10px;
  border-radius: 5px;
  background: #f5f7fa;
  color: #606266;
}

.phase2-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin: 18px 0;
}

.phase2-tools input {
  min-width: 280px;
  min-height: 38px;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  padding: 0 10px;
}

.table-wrap {
  max-height: 620px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid #e4e7ed;
  text-align: left;
}

th {
  position: sticky;
  top: 0;
  background: #f5f7fa;
}

.file-group {
  margin-top: 18px;
}

.file-group ul {
  margin: 0;
  padding-left: 20px;
}

.file-group li {
  margin: 7px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

button {
  border: none;
  border-radius: 5px;
  padding: 6px 12px;
  background: #5979c2;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.empty {
  text-align: center;
  color: #909399;
}
</style>
