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
          <label class="phase2-search">
            <span>Search assemblies</span>
            <input v-model.trim="phase2Search" placeholder="e.g. CPCERZ200001">
          </label>
          <fieldset class="haplotype-filter">
            <legend>Haplotype files</legend>
            <label :class="{ active: showHaplotype1 }">
              <input type="checkbox" v-model="showHaplotype1">
              <span>Haplotype .1</span>
            </label>
            <label :class="{ active: showHaplotype2 }">
              <input type="checkbox" v-model="showHaplotype2">
              <span>Haplotype .2</span>
            </label>
          </fieldset>
        </div>

        <p class="muted">
          <span v-if="loadingFiles">Loading download files...</span>
          <span v-else>Showing {{ filteredPhase2Rows.length }} of {{ phase2Rows.length }} assemblies</span>
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
import DownloadCell from '@/components/DownloadCell.vue'
import { applyPhase2 } from '@/api/auth'
import { downloadDataFile, getDataFiles } from '@/api/dataAccess'
import { getCurrentUser, hasPhase2Access, isLoggedIn as authIsLoggedIn, setCurrentUser } from '@/utils/auth'

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
        if (!sampleName || !haplotypeMatch) return
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
      return Array.from(rows.values()).sort((left, right) => left.id.localeCompare(right.id))
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
  display: grid;
  grid-template-columns: minmax(280px, 1fr) auto;
  gap: 18px;
  align-items: end;
  margin: 18px 0;
  padding: 16px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  background: #f8fafc;
}

.phase2-search {
  display: grid;
  gap: 7px;
  color: #485568;
  font-size: 0.82rem;
  font-weight: 700;
}

.phase2-search input {
  width: 100%;
  min-height: 38px;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  padding: 0 10px;
  background: #fff;
  font: inherit;
  font-weight: 400;
}

.haplotype-filter {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.haplotype-filter legend {
  width: auto;
  margin: 0 10px 0 0;
  color: #485568;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 38px;
}

.haplotype-filter label {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid #cfd7e5;
  border-radius: 6px;
  background: #fff;
  color: #566274;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 650;
  transition: 0.16s ease;
}

.haplotype-filter label.active {
  border-color: #5979c2;
  background: #5979c2;
  color: #fff;
}

.haplotype-filter input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
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

th:first-child,
td:first-child {
  width: 150px;
}

th:not(:first-child),
td:not(:first-child) {
  width: 225px;
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

@media (max-width: 760px) {
  .phase2-tools {
    grid-template-columns: 1fr;
  }

  .haplotype-filter {
    flex-wrap: wrap;
  }

  .haplotype-filter legend {
    width: 100%;
    line-height: 1.3;
  }
}
</style>
