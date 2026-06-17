<template>
  <div class="data-page">
    <section class="code-availability">
      <h2>Code Availability</h2>
      <p>
        All the codes needed to reproduce the results from this work can be found on GitHub,
        <a href="https://github.com/orgs/Shuhua-Group/repositories" target="_blank" rel="noopener">
          https://github.com/orgs/Shuhua-Group/repositories
        </a>.
      </p>
    </section>

    <AuthRequiredOverlay
      :allowed="canAccessPhase1"
      locked-text="Please log in to access downloads."
      :action-text="isLoggedIn ? 'Refresh access' : 'Login'"
      @action="goLogin"
    >
      <template #preview>
        <section class="phase-section preview-section">
          <h2>The CPC Phase I Data Availability</h2>
          <p>
            The release of the CPC Phase I data has been approved by The Ministry of Science and Technology of the People's Republic of China
            (permission no. 2022BAT2392). File downloads require login.
          </p>
          <h3>CPC pangenome reference</h3>
          <div class="file-group preview-group">
            <h4>CPC.Phase1.CHM13v2-full</h4>
            <ul>
              <li><span>CPC.Phase1.CHM13v2-full.gfa.gz</span></li>
              <li><span>CPC.Phase1.CHM13v2-full.gbwt</span></li>
              <li><span>CPC.Phase1.CHM13v2-full.gg</span></li>
            </ul>
          </div>
        </section>
      </template>

      <section class="phase-section">
        <h2>The CPC Phase I Data Availability</h2>
        <p>
          The release of the CPC Phase I data has been approved by The Ministry of Science and Technology of the People's Republic of China
          (permission no. 2022BAT2392). The raw data are available at the National Genomics Data Center
          (<a href="https://ngdc.cncb.ac.cn" target="_blank" rel="noopener">https://ngdc.cncb.ac.cn</a>)
          under the BioProject PRJCA011422. The Pangenome References built based on the CPC core samples and combined with the HPRC samples
          are freely available at both the CPC website
          (<a href="https://pog.fudan.edu.cn/cpc/#/data" target="_blank" rel="noopener">https://pog.fudan.edu.cn/cpc/#/data</a>)
          and GitHub
          (<a href="https://github.com/Shuhua-Group/Chinese-Pangenome-Consortium-Phase-I" target="_blank" rel="noopener">https://github.com/Shuhua-Group/Chinese-Pangenome-Consortium-Phase-I</a>).
        </p>

        <h3>CPC pangenome reference</h3>
        <div v-for="group in cpcGroups" :key="group" class="file-group">
          <h4>{{ group }}</h4>
          <ul>
            <li v-for="file in filesByGroup(group)" :key="file.key">
              <button class="download-link" type="button" :disabled="isDownloading(file)" @click="download('phase1', file)">
                {{ isDownloading(file) ? 'Downloading...' : file.name }}
              </button>
            </li>
          </ul>
        </div>

        <h3>CPC &amp; HPRC pangenome reference</h3>
        <div v-for="group in cpcHprcGroups" :key="group" class="file-group">
          <h4>{{ group }}</h4>
          <ul>
            <li v-for="file in filesByGroup(group)" :key="file.key">
              <button class="download-link" type="button" :disabled="isDownloading(file)" @click="download('phase1', file)">
                {{ isDownloading(file) ? 'Downloading...' : file.name }}
              </button>
            </li>
          </ul>
        </div>

        <h3>Genome annotation files (*.GFF3) for polished assemblies of 58 core samples</h3>
        <div v-for="group in gffGroups" :key="group" class="file-group">
          <h4>{{ group }}</h4>
          <ul>
            <li v-for="file in filesByGroup(group)" :key="file.key">
              <button class="download-link" type="button" :disabled="isDownloading(file)" @click="download('phase1', file)">
                {{ isDownloading(file) ? 'Downloading...' : file.name }}
              </button>
            </li>
          </ul>
        </div>

        <h3>
          SV file of CPC &amp; HPRC pangenome processed by the
          <a href="https://github.com/Shuhua-Group/PanGenome_VCF_PostProcess" target="_blank" rel="noopener">PanGenome_VCF_PostProcess</a>
        </h3>
        <div v-for="group in svGroups" :key="group" class="file-group">
          <h4>{{ group }}</h4>
          <p class="note">
            We have updated the process strategy about the complex loci with both small variants and SVs alleles,
            so that the number of variants is slightly different than in the paper.
          </p>
          <ul>
            <li v-for="file in filesByGroup(group)" :key="file.key">
              <button class="download-link" type="button" :disabled="isDownloading(file)" @click="download('phase1', file)">
                {{ isDownloading(file) ? 'Downloading...' : file.name }}
              </button>
            </li>
          </ul>
        </div>

        <h3>CPC phase I (updated March 18, 2025)</h3>
        <div v-for="group in ebvGroups" :key="group" class="file-group">
          <h4>EBV sequence annotation</h4>
          <ul>
            <li v-for="file in filesByGroup(group)" :key="file.key">
              <button class="download-link" type="button" :disabled="isDownloading(file)" @click="download('phase1', file)">
                {{ isDownloading(file) ? 'Downloading...' : file.name }}
              </button>
            </li>
          </ul>
        </div>
      </section>
    </AuthRequiredOverlay>

    <AuthRequiredOverlay
      :allowed="canAccessPhase2"
      locked-text="Please log in and request access to view Phase II downloads."
      :action-text="phase2ActionText"
      @action="handlePhase2Action"
    >
      <template #preview>
        <section class="phase-section preview-section">
          <h2>The CPC Phase II Data Availability</h2>
          <p>
            The release of the CPC Phase II data has been approved by the National Health Commission of the People's Republic of China
            (No. 2025BAT01059). CPC2 assemblies, summary data and detailed information are available through CPC-controlled access.
          </p>
          <p>
            The near T2T CPC.Ref2 comprises 948 haplotype-resolved assemblies from 474 individuals representing
            60 ethnolinguistic groups across China.
          </p>
          <div class="table-wrap preview-table">
            <table>
              <thead>
                <tr>
                  <th>Sample</th>
                  <th>FASTA (.fa.gz)</th>
                  <th>Index (.fai)</th>
                  <th>GZI (.gzi)</th>
                  <th>Checksum (.md5)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CPCERZ200001.1</td>
                  <td><span>CPCERZ200001.1.fa.gz</span></td>
                  <td><span>CPCERZ200001.1.fa.gz.fai</span></td>
                  <td><span>CPCERZ200001.1.fa.gz.gzi</span></td>
                  <td><span>CPCERZ200001.1.fa.gz.md5</span></td>
                </tr>
                <tr>
                  <td>CPCERZ200001.2</td>
                  <td><span>CPCERZ200001.2.fa.gz</span></td>
                  <td><span>CPCERZ200001.2.fa.gz.fai</span></td>
                  <td><span>CPCERZ200001.2.fa.gz.gzi</span></td>
                  <td><span>CPCERZ200001.2.fa.gz.md5</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <section class="phase-section">
        <h2>The CPC Phase II Data Availability</h2>
        <p>
          The release of the CPC Phase II data has been approved by the National Health Commission of the People's Republic of China
          (No. 2025BAT01059). CPC2 assemblies, summary data and detailed information are available through CPC-controlled access.
        </p>

        <div class="phase2-tools">
          <input v-model.trim="phase2Search" placeholder="Search samples, e.g. CPCERZ200001">
          <label><input type="checkbox" v-model="showHaplotype1"> .1 files</label>
          <label><input type="checkbox" v-model="showHaplotype2"> .2 files</label>
        </div>

        <p class="muted">
          Showing {{ filteredPhase2Rows.length }} of {{ phase2Rows.length }} assemblies
          <span v-if="phase2Search">(Search: "{{ phase2Search }}")</span>
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sample</th>
                <th>FASTA (.fa.gz)</th>
                <th>Index (.fai)</th>
                <th>GZI (.gzi)</th>
                <th>Checksum (.md5)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredPhase2Rows" :key="row.id">
                <td class="sample-cell">{{ row.displayName }}</td>
                <td><DownloadCell :file="row.FASTA" :downloading-key="downloadingKey" @download="download('phase2', $event)" /></td>
                <td><DownloadCell :file="row.Index" :downloading-key="downloadingKey" @download="download('phase2', $event)" /></td>
                <td><DownloadCell :file="row.GZI" :downloading-key="downloadingKey" @download="download('phase2', $event)" /></td>
                <td><DownloadCell :file="row.Checksum" :downloading-key="downloadingKey" @download="download('phase2', $event)" /></td>
              </tr>
              <tr v-if="filteredPhase2Rows.length === 0">
                <td colspan="5" class="empty">No files match your filters.</td>
              </tr>
            </tbody>
          </table>
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

const DownloadCell = {
  name: 'DownloadCell',
  props: {
    file: {
      type: Object,
      default: null
    },
    downloadingKey: {
      type: String,
      default: ''
    }
  },
  methods: {
    isDownloading(file) {
      return file && this.downloadingKey === file.key
    }
  },
  template: `
    <span>
      <button
        v-if="file"
        class="download-link"
        type="button"
        :disabled="isDownloading(file)"
        @click="$emit('download', file)"
      >
        {{ isDownloading(file) ? 'Downloading...' : file.name }}
      </button>
      <span v-else class="missing-file">Not available</span>
    </span>
  `
}

export default {
  name: 'DataPage',
  components: { AuthRequiredOverlay, DownloadCell },
  data() {
    return {
      currentUser: getCurrentUser(),
      phase1Files: [],
      phase2Files: [],
      phase2Search: '',
      showHaplotype1: true,
      showHaplotype2: true,
      loadingFiles: false,
      downloadingKey: '',
      cpcGroups: ['CPC.Phase1.CHM13v2-full', 'CPC.Phase1.CHM13v2', 'CPC.Phase1.CHM13v2-minaf.0.1'],
      cpcHprcGroups: [
        'CPC.HPRC.Phase1.CHM13v2',
        'CPC.HPRC.Phase1.CHM13v2-minaf.0.1',
        'CPC.HPRC.Phase1.GRCh38-MAF01.cactus264',
        'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus',
        'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full'
      ],
      gffGroups: ['CPC.p1.58inds.GFF3'],
      svGroups: ['CPC.HPRC.Phase1.processed.SVs.normed'],
      ebvGroups: ['CPC.phaseI.EBV']
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
      if (!this.isLoggedIn) return 'Login'
      if (this.currentUser && this.currentUser.phase2Status === 'PENDING') return 'Pending approval'
      return 'Request access'
    },
    phase2Rows() {
      const rows = new Map()
      this.phase2Files.forEach(file => {
        const sampleName = file.sampleName || file.groupName
        const haplotypeMatch = file.name.match(/\.(1|2)\.fa\.gz/)
        const haplotype = haplotypeMatch ? haplotypeMatch[1] : ''
        const id = `${sampleName}.${haplotype}`
        if (!rows.has(id)) {
          rows.set(id, {
            id,
            sampleName,
            haplotype,
            displayName: id
          })
        }
        rows.get(id)[file.fileType] = file
      })
      return Array.from(rows.values())
    },
    filteredPhase2Rows() {
      const query = this.phase2Search.toLowerCase()
      return this.phase2Rows.filter(row => {
        const hapMatch = (this.showHaplotype1 && row.haplotype === '1') || (this.showHaplotype2 && row.haplotype === '2')
        if (!hapMatch) return false
        if (!query) return true
        return row.displayName.toLowerCase().includes(query) || row.sampleName.toLowerCase().includes(query)
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
        this.phase1Files = (response.data.phase1 && response.data.phase1.files) || []
        this.phase2Files = (response.data.phase2 && response.data.phase2.files) || []
      } finally {
        this.loadingFiles = false
      }
    },
    filesByGroup(group) {
      return this.phase1Files.filter(file => file.groupName === group)
    },
    isDownloading(file) {
      return file && this.downloadingKey === file.key
    },
    async download(phase, file) {
      if (!file || this.downloadingKey) return
      this.downloadingKey = file.key
      try {
        await downloadDataFile(phase, file.key, file.name)
      } catch (err) {
        const message = err && err.message ? err.message : 'Download failed.'
        if (this.$message) {
          this.$message.error(message)
        } else {
          window.alert(message)
        }
      } finally {
        this.downloadingKey = ''
      }
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

.code-availability,
.phase-section {
  margin: 20px 0;
}

.phase-section {
  padding-bottom: 14px;
}

.data-page h2 {
  height: auto;
  line-height: 1.3;
  padding: 12px 16px;
  background: #2b4275;
  color: #fff;
  border-radius: 5px;
}

.data-page h2::before {
  background-color: #f8f9fa;
}

.data-page h3 {
  margin: 22px 0 12px;
  color: #2b4275;
  font-size: 23px;
  font-weight: 600;
}

.data-page h4 {
  margin: 12px 0 8px;
  color: #383d48;
  font-size: 16px;
  font-weight: 600;
}

.data-page p {
  color: #606266;
  line-height: 1.65;
  text-align: justify;
}

.file-group {
  padding-left: 20px;
}

.file-group ul {
  margin: 0;
  padding-left: 20px;
}

.file-group li {
  margin: 7px 0;
}

.download-link {
  display: inline;
  border: none;
  background: transparent;
  color: var(--bs-link-color);
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font: inherit;
  text-align: left;
}

.download-link:hover:not(:disabled) {
  color: #2b4275;
}

.download-link:disabled {
  cursor: wait;
  color: #909399;
}

.note {
  margin-left: 15px;
  color: #383d48;
}

.preview-section {
  min-height: 330px;
}

.preview-group span,
.preview-table span {
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

.muted {
  color: #606266;
}

.table-wrap {
  max-height: 620px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
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
  vertical-align: top;
}

th {
  position: sticky;
  top: 0;
  background: #f5f7fa;
  color: #333;
  font-weight: 600;
}

.sample-cell {
  color: #4343d0;
  font-weight: 600;
  white-space: nowrap;
}

.missing-file,
.empty {
  color: #909399;
}

.empty {
  text-align: center;
}

@media (max-width: 1200px) {
  table {
    min-width: 980px;
  }
}
</style>
