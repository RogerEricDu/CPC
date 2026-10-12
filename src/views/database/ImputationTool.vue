<template>
  <section class="imputation-tool" aria-labelledby="imputation-title">
    <div class="tool-intro">
      <div>
        <span class="eyebrow">Online analysis</span>
        <h2 id="imputation-title">Genotype Imputation</h2>
        <p>
          Submit chromosome-level VCF data to the Chinese Pangenome reference panel and
          follow every validation and compute stage online.
        </p>
      </div>
      <div class="intro-mark" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>

    <div v-if="accessLoading" class="surface access-skeleton">
      <span class="spinner"></span>
      <div>
        <strong>Checking Imputation access</strong>
        <p>Your current approval status is being loaded.</p>
      </div>
    </div>

    <div v-else-if="accessError" class="surface state-card state-error">
      <div class="state-icon"><i class="el-icon-warning-outline"></i></div>
      <div class="state-copy">
        <span class="state-label">Access status unavailable</span>
        <h3>We could not load your Imputation permission.</h3>
        <p>{{ accessError }}</p>
      </div>
      <button class="btn secondary" @click="loadAccess">Try again</button>
    </div>

    <template v-else>
      <div v-if="!hasApprovedAccess" class="surface state-card" :class="accessCardClass">
        <div class="state-icon">
          <i :class="accessIcon"></i>
        </div>
        <div class="state-copy">
          <span class="state-label">Imputation access · {{ accessStatusLabel }}</span>
          <h3>{{ accessHeadline }}</h3>
          <p>{{ accessDescription }}</p>
          <dl v-if="access.status === 'PENDING'" class="request-summary">
            <div v-if="access.requestedAt">
              <dt>Submitted</dt>
              <dd>{{ formatDate(access.requestedAt) }}</dd>
            </div>
            <div v-if="access.reason">
              <dt>Research purpose</dt>
              <dd>{{ access.reason }}</dd>
            </div>
          </dl>
          <div v-if="access.status === 'REJECTED' && access.reviewNote" class="review-note">
            <strong>Reviewer note</strong>
            <span>{{ access.reviewNote }}</span>
          </div>

          <form
            v-if="access.status === 'NOT_REQUESTED' || access.status === 'REJECTED'"
            class="access-form"
            @submit.prevent="submitAccessRequest"
          >
            <label for="access-reason">Briefly describe your research use</label>
            <textarea
              id="access-reason"
              v-model.trim="applicationReason"
              maxlength="1000"
              rows="4"
              placeholder="Describe the study, expected sample scope, and intended use of the imputed results."
            ></textarea>
            <div class="form-foot">
              <span>{{ applicationReason.length }}/1000 · minimum 20 characters</span>
              <button
                type="submit"
                class="btn primary"
                :disabled="requestingAccess || applicationReason.length < 20"
              >
                <span v-if="requestingAccess" class="button-spinner"></span>
                {{ requestingAccess ? 'Submitting…' : access.status === 'REJECTED' ? 'Submit a new request' : 'Request access' }}
              </button>
            </div>
          </form>
        </div>
        <button
          v-if="access.status === 'PENDING'"
          class="btn secondary"
          :disabled="accessRefreshing"
          @click="loadAccess(true)"
        >
          <span v-if="accessRefreshing" class="spinner small"></span>
          {{ accessRefreshing ? 'Refreshing…' : 'Refresh status' }}
        </button>
      </div>

      <template v-if="hasApprovedAccess">
        <div class="surface access-approved">
          <div class="approved-icon"><i class="el-icon-circle-check"></i></div>
          <div>
            <span>Imputation access enabled</span>
            <p>Your submissions and result downloads are private to your CPC account.</p>
          </div>
          <button class="text-btn" @click="loadWorkspace(true)">
            <i class="el-icon-refresh"></i> Refresh workspace
          </button>
        </div>

        <div class="workspace-grid">
          <article class="surface submission-card">
            <div class="section-heading">
              <div>
                <span class="step-number">01</span>
                <h3>Configure a new task</h3>
              </div>
              <span v-if="optionsLoading" class="loading-label"><span class="spinner small"></span> Loading panels</span>
            </div>

            <div v-if="optionsError" class="inline-alert danger">
              <i class="el-icon-warning-outline"></i>
              <span>{{ optionsError }}</span>
              <button @click="loadOptions">Retry</button>
            </div>

            <div class="settings-grid">
              <label class="field">
                <span>Genome build</span>
                <select v-model="form.genomeBuild" :disabled="optionsLoading || uploading" @change="syncOptionSelection">
                  <option v-for="build in availableBuilds" :key="build.value" :value="build.value">
                    {{ build.label }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>Chromosome</span>
                <select v-model="form.chromosome" :disabled="optionsLoading || uploading">
                  <option v-for="chromosome in availableChromosomes" :key="chromosome.value" :value="chromosome.value">
                    {{ chromosome.label }}
                  </option>
                </select>
              </label>
              <label class="field wide">
                <span>Reference panel</span>
                <select v-model="form.referencePanelId" :disabled="optionsLoading || uploading" @change="syncOptionSelection">
                  <option v-for="panel in availablePanels" :key="panel.value" :value="panel.value">
                    {{ panel.label }}
                  </option>
                </select>
                <small v-if="selectedPanel && selectedPanel.description">{{ selectedPanel.description }}</small>
              </label>
            </div>

            <div class="file-grid">
              <div
                class="file-drop primary-file"
                :class="{ dragging: draggingVcf, populated: !!vcfFile, invalid: !!fileError }"
                role="button"
                tabindex="0"
                @click="chooseFile('vcf')"
                @keydown.enter.prevent="chooseFile('vcf')"
                @dragenter.prevent="draggingVcf = true"
                @dragover.prevent="draggingVcf = true"
                @dragleave.prevent="draggingVcf = false"
                @drop.prevent="handleDrop($event, 'vcf')"
              >
                <input ref="vcfInput" type="file" accept=".vcf.gz,application/gzip" hidden @change="handleFileSelect($event, 'vcf')">
                <div class="file-icon"><i :class="vcfFile ? 'el-icon-document-checked' : 'el-icon-upload2'"></i></div>
                <template v-if="vcfFile">
                  <strong>{{ vcfFile.name }}</strong>
                  <span>{{ formatFileSize(vcfFile.size) }}</span>
                  <button type="button" class="remove-file" aria-label="Remove VCF file" @click.stop="removeFile('vcf')">
                    <i class="el-icon-close"></i>
                  </button>
                </template>
                <template v-else>
                  <strong>Target VCF.gz <b>required</b></strong>
                  <span>Drop a bgzip-compressed VCF here or browse</span>
                </template>
              </div>

              <div
                class="file-drop"
                :class="{ dragging: draggingIndex, populated: !!indexFile }"
                role="button"
                tabindex="0"
                @click="chooseFile('index')"
                @keydown.enter.prevent="chooseFile('index')"
                @dragenter.prevent="draggingIndex = true"
                @dragover.prevent="draggingIndex = true"
                @dragleave.prevent="draggingIndex = false"
                @drop.prevent="handleDrop($event, 'index')"
              >
                <input ref="indexInput" type="file" accept=".tbi" hidden @change="handleFileSelect($event, 'index')">
                <div class="file-icon"><i :class="indexFile ? 'el-icon-document-checked' : 'el-icon-document-add'"></i></div>
                <template v-if="indexFile">
                  <strong>{{ indexFile.name }}</strong>
                  <span>{{ formatFileSize(indexFile.size) }}</span>
                  <button type="button" class="remove-file" aria-label="Remove index file" @click.stop="removeFile('index')">
                    <i class="el-icon-close"></i>
                  </button>
                </template>
                <template v-else>
                  <strong>Tabix index <b>required</b></strong>
                  <span>Add the matching .vcf.gz.tbi required by Minimac4</span>
                </template>
              </div>
            </div>

            <div v-if="fileError" class="inline-alert danger">
              <i class="el-icon-warning-outline"></i><span>{{ fileError }}</span>
            </div>
            <div v-else-if="fileWarning" class="inline-alert warning">
              <i class="el-icon-info"></i><span>{{ fileWarning }}</span>
            </div>
            <div v-else class="input-guidance">
              <span><i class="el-icon-circle-check"></i> GRCh38 coordinates</span>
              <span><i class="el-icon-circle-check"></i> One supported chromosome per task</span>
              <span><i class="el-icon-circle-check"></i> Samples and variants in VCF format</span>
            </div>

            <div v-if="uploading" class="upload-progress" aria-live="polite">
              <div>
                <span>{{ uploadProgress < 100 ? 'Uploading securely' : 'Creating and validating task' }}</span>
                <strong>{{ uploadProgress }}%</strong>
              </div>
              <div class="progress-track"><span :style="{ width: uploadProgress + '%' }"></span></div>
              <p>Keep this page open until the task appears in your history.</p>
            </div>

            <div class="submit-row">
              <div>
                <strong>Ready for server-side validation</strong>
                <span v-if="maxUploadBytes">Maximum VCF size: {{ formatFileSize(maxUploadBytes) }}</span>
                <span v-else>The server will validate format, chromosome, and sample records.</span>
              </div>
              <button class="btn primary submit-btn" :disabled="!canSubmit" @click="submitTask">
                <span v-if="uploading" class="button-spinner"></span>
                {{ uploading ? 'Submitting…' : 'Start Imputation' }}
              </button>
            </div>
          </article>

          <aside class="surface process-card">
            <div class="section-heading compact">
              <div>
                <span class="step-number">02</span>
                <h3>Processing stages</h3>
              </div>
            </div>
            <ol class="stage-list">
              <li><span>1</span><div><strong>Input validation</strong><p>BGZF/VCF structure, chromosome consistency, and Tabix index format checks.</p></div></li>
              <li><span>2</span><div><strong>Queued compute</strong><p>Fair, resource-limited scheduling on CPC infrastructure.</p></div></li>
              <li><span>3</span><div><strong>Minimac4 imputation</strong><p>Phased Chinese Pangenome reference panel processing.</p></div></li>
              <li><span>4</span><div><strong>Result preparation</strong><p>Output integrity checks and time-limited download ticket.</p></div></li>
            </ol>
            <div class="privacy-note">
              <i class="el-icon-lock"></i>
              <p><strong>Account-scoped jobs</strong>Your task status and downloads cannot be opened by another user.</p>
            </div>
          </aside>
        </div>

        <section class="history-section">
          <div class="history-heading">
            <div>
              <span class="eyebrow">Persistent workspace</span>
              <h3>Task history</h3>
              <p>Active tasks recover automatically after refresh or when you return to this tab.</p>
            </div>
            <div class="history-tools">
              <select v-model="statusFilter" aria-label="Filter task history by status">
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUCCEEDED">Succeeded</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <button class="btn secondary" :disabled="tasksLoading" @click="loadTasks(true)">
                <i class="el-icon-refresh" :class="{ rotating: tasksLoading }"></i> Refresh
              </button>
            </div>
          </div>

          <div v-if="pollWarning" class="inline-alert warning poll-warning">
            <i class="el-icon-connection"></i>
            <span>{{ pollWarning }} Displayed task data has been retained; reconnecting automatically.</span>
          </div>
          <div v-if="historyError && tasks.length === 0" class="surface history-empty error-empty">
            <i class="el-icon-warning-outline"></i>
            <h4>Task history could not be loaded</h4>
            <p>{{ historyError }}</p>
            <button class="btn secondary" @click="loadTasks(true)">Try again</button>
          </div>
          <div v-else-if="tasksLoading && tasks.length === 0" class="surface history-empty">
            <span class="spinner"></span>
            <h4>Loading your tasks</h4>
          </div>
          <div v-else-if="filteredTasks.length === 0" class="surface history-empty">
            <i class="el-icon-folder-opened"></i>
            <h4>{{ tasks.length ? 'No tasks match this filter' : 'No Imputation tasks yet' }}</h4>
            <p>{{ tasks.length ? 'Choose another status to see your tasks.' : 'Your first submitted task will appear here and remain available after refresh.' }}</p>
          </div>

          <div v-else class="task-list">
            <article v-for="task in filteredTasks" :key="task.id" class="surface task-card" :class="statusClass(task.status)">
              <div class="task-main">
                <div class="task-topline">
                  <div>
                    <span class="status-pill" :class="statusClass(task.status)">
                      <i :class="statusIcon(task.status)"></i>{{ statusLabel(task.status) }}
                    </span>
                    <span class="task-id">#{{ shortId(task.id) }}</span>
                  </div>
                  <time :datetime="task.createdAt || ''">{{ formatDate(task.createdAt) }}</time>
                </div>
                <h4>{{ task.name || task.fileName || 'Imputation task' }}</h4>
                <div class="task-meta">
                  <span v-if="task.genomeBuild">{{ task.genomeBuild }}</span>
                  <span v-if="task.chromosome">chr{{ stripChr(task.chromosome) }}</span>
                  <span v-if="task.referencePanelLabel || task.referencePanelId">{{ task.referencePanelLabel || task.referencePanelId }}</span>
                  <span v-if="task.fileName"><i class="el-icon-document"></i> {{ task.fileName }}</span>
                </div>

                <div class="task-stage">
                  <div class="stage-copy">
                    <strong>{{ stageLabel(task) }}</strong>
                    <span>{{ task.message || stageDescription(task) }}</span>
                  </div>
                  <strong class="progress-number">{{ task.progress }}%</strong>
                </div>
                <div class="progress-track task-progress">
                  <span :style="{ width: task.progress + '%' }"></span>
                </div>

                <div v-if="task.errorMessage" class="task-error">
                  <i class="el-icon-warning-outline"></i>
                  <div>
                    <strong>Task failed</strong>
                    <p>{{ task.errorMessage }}</p>
                    <small v-if="task.errorHint">{{ task.errorHint }}</small>
                  </div>
                </div>
              </div>

              <div class="task-actions">
                <button
                  v-if="canCancelTask(task)"
                  class="btn danger-outline"
                  :disabled="actionTaskId === task.id"
                  @click="cancelTask(task)"
                >
                  <i class="el-icon-close"></i> Cancel
                </button>
                <button
                  v-if="canRetryTask(task)"
                  class="btn secondary"
                  :disabled="actionTaskId === task.id"
                  @click="retryTask(task)"
                >
                  <i class="el-icon-refresh-right"></i> Retry
                </button>
                <button
                  v-if="canDownloadTask(task)"
                  class="btn success"
                  :disabled="actionTaskId === task.id"
                  @click="downloadTask(task)"
                >
                  <i class="el-icon-download"></i> Download result
                </button>
              </div>
            </article>
          </div>
          <div v-if="tasks.length && hasMoreTasks" class="history-load-more">
            <button class="btn secondary" :disabled="tasksLoadingMore" @click="loadMoreTasks">
              <span v-if="tasksLoadingMore" class="button-spinner"></span>
              {{ tasksLoadingMore ? 'Loading older tasks...' : `Load older tasks (${remainingTaskCount} remaining)` }}
            </button>
          </div>
        </section>
      </template>
    </template>
  </section>
</template>

<script>
import {
  cancelImputationTask,
  createImputationDownloadTicket,
  createImputationTask,
  getImputationAccess,
  getImputationOptions,
  getImputationTask,
  getImputationTasks,
  requestImputationAccess,
  retryImputationTask
} from '@/api/imputation'
import { getCurrentUser } from '@/utils/auth'

const TERMINAL_STATUSES = ['SUCCEEDED', 'COMPLETED', 'FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED']
const ACTIVE_STATUSES = ['PENDING', 'CREATED', 'UPLOADING', 'VALIDATING', 'QUEUED', 'RUNNING', 'FINALIZING', 'CANCELLING', 'CANCEL_REQUESTED']

export default {
  name: 'ImputationTool',
  data() {
    return {
      access: {
        status: 'NOT_REQUESTED',
        reason: '',
        reviewNote: '',
        requestedAt: null
      },
      accessLoading: true,
      accessRefreshing: false,
      accessError: '',
      accessPollTimer: null,
      applicationReason: '',
      requestingAccess: false,
      optionsLoading: false,
      optionsError: '',
      options: {
        builds: [],
        chromosomes: [],
        panels: [],
        maxUploadBytes: null,
        maxIndexBytes: null
      },
      form: {
        genomeBuild: '',
        chromosome: '',
        referencePanelId: ''
      },
      vcfFile: null,
      indexFile: null,
      draggingVcf: false,
      draggingIndex: false,
      fileError: '',
      fileWarning: '',
      uploading: false,
      uploadProgress: 0,
      tasks: [],
      totalTasks: 0,
      loadedTaskCount: 0,
      taskPage: 1,
      taskPageSize: 50,
      tasksLoading: false,
      tasksLoadingMore: false,
      historyError: '',
      statusFilter: 'ALL',
      actionTaskId: '',
      pollTimer: null,
      pollDelay: 3000,
      pollFailures: 0,
      pollWarning: '',
      pollInFlight: false,
      pollTick: 0
    }
  },
  computed: {
    hasApprovedAccess() {
      return this.access.status === 'APPROVED'
    },
    accessStatusLabel() {
      return {
        NOT_REQUESTED: 'Not requested',
        PENDING: 'Under review',
        REJECTED: 'Changes requested'
      }[this.access.status] || this.prettyEnum(this.access.status)
    },
    accessHeadline() {
      return {
        NOT_REQUESTED: 'Request access before submitting genomic data',
        PENDING: 'Your request is waiting for administrator review',
        REJECTED: 'Your previous request was not approved'
      }[this.access.status] || 'Imputation access is required'
    },
    accessDescription() {
      return {
        NOT_REQUESTED: 'Imputation uses managed compute and protected reference assets. Tell us briefly how you plan to use the service.',
        PENDING: 'No further action is needed. This page will show the upload workspace as soon as your request is approved.',
        REJECTED: 'Review the note below, update your research purpose, and submit a new request when ready.'
      }[this.access.status] || 'Contact a CPC administrator if this state does not change.'
    },
    accessIcon() {
      return {
        NOT_REQUESTED: 'el-icon-lock',
        PENDING: 'el-icon-time',
        REJECTED: 'el-icon-warning-outline'
      }[this.access.status] || 'el-icon-lock'
    },
    accessCardClass() {
      return {
        'state-pending': this.access.status === 'PENDING',
        'state-rejected': this.access.status === 'REJECTED'
      }
    },
    availableBuilds() {
      return this.options.builds
    },
    availablePanels() {
      return this.options.panels.filter(panel => !panel.genomeBuild || panel.genomeBuild === this.form.genomeBuild)
    },
    selectedPanel() {
      return this.options.panels.find(panel => panel.value === this.form.referencePanelId) || null
    },
    availableChromosomes() {
      const panelChromosomes = this.selectedPanel && this.selectedPanel.chromosomes.length
        ? this.selectedPanel.chromosomes
        : null
      return this.options.chromosomes.filter(chromosome => {
        const buildMatches = !chromosome.genomeBuild || chromosome.genomeBuild === this.form.genomeBuild
        const panelMatches = !panelChromosomes || panelChromosomes.includes(chromosome.value)
        return buildMatches && panelMatches
      })
    },
    maxUploadBytes() {
      return this.options.maxUploadBytes
    },
    canSubmit() {
      return this.hasApprovedAccess &&
        !this.uploading &&
        !!this.vcfFile &&
        !!this.indexFile &&
        !this.fileError &&
        !!this.form.genomeBuild &&
        !!this.form.chromosome &&
        !!this.form.referencePanelId &&
        !this.optionsLoading &&
        !this.optionsError
    },
    filteredTasks() {
      if (this.statusFilter === 'ALL') return this.tasks
      if (this.statusFilter === 'ACTIVE') {
        return this.tasks.filter(task => !TERMINAL_STATUSES.includes(task.status))
      }
      if (this.statusFilter === 'SUCCEEDED') {
        return this.tasks.filter(task => ['SUCCEEDED', 'COMPLETED'].includes(task.status))
      }
      if (this.statusFilter === 'CANCELLED') {
        return this.tasks.filter(task => ['CANCELLED', 'CANCELED'].includes(task.status))
      }
      return this.tasks.filter(task => task.status === this.statusFilter)
    },
    activeTasks() {
      return this.tasks.filter(task => !TERMINAL_STATUSES.includes(task.status))
    },
    hasMoreTasks() {
      return this.loadedTaskCount < this.totalTasks
    },
    remainingTaskCount() {
      return Math.max(0, this.totalTasks - this.loadedTaskCount)
    },
    storageKey() {
      const user = getCurrentUser() || {}
      const identity = user.id || user.username || 'current-user'
      return `cpc_imputation_task_ids:${identity}`
    }
  },
  watch: {
    statusFilter(value) {
      try {
        window.sessionStorage.setItem('cpc_imputation_status_filter', value)
      } catch (e) {
        // Storage can be disabled; filtering still works for the current render.
      }
    }
  },
  created() {
    try {
      this.statusFilter = window.sessionStorage.getItem('cpc_imputation_status_filter') || 'ALL'
    } catch (e) {
      this.statusFilter = 'ALL'
    }
    this.loadAccess()
  },
  mounted() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  },
  beforeDestroy() {
    this.clearPoll()
    this.clearAccessPoll()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  },
  methods: {
    async loadAccess(silent = false) {
      const quiet = silent === true
      if (quiet) {
        this.accessRefreshing = true
      } else {
        this.accessLoading = true
      }
      this.accessError = ''
      try {
        const response = await getImputationAccess()
        this.access = this.normalizeAccess(response.data)
        if (this.access.status === 'REJECTED') {
          this.applicationReason = this.access.reason || ''
        }
        if (this.hasApprovedAccess) {
          await this.loadWorkspace(false)
        } else {
          this.clearPoll()
        }
      } catch (error) {
        this.accessError = this.errorMessage(error, 'Unable to retrieve Imputation access.')
      } finally {
        this.accessLoading = false
        this.accessRefreshing = false
        this.scheduleAccessPoll(this.access.status === 'PENDING' ? 30000 : null)
      }
    },
    normalizeAccess(payload) {
      const value = payload || {}
      const rawStatus = value.status || value.accessStatus || value.requestStatus || (value.approved ? 'APPROVED' : 'NOT_REQUESTED')
      return {
        ...value,
        status: String(rawStatus || 'NOT_REQUESTED').toUpperCase(),
        reason: value.reason || value.applicationReason || value.requestReason || '',
        reviewNote: value.reviewNote || value.rejectionReason || value.decisionNote || '',
        requestedAt: value.requestedAt || value.submittedAt || value.createdAt || null
      }
    },
    async submitAccessRequest() {
      if (this.applicationReason.length < 20 || this.requestingAccess) return
      this.requestingAccess = true
      try {
        const response = await requestImputationAccess({ reason: this.applicationReason })
        this.access = this.normalizeAccess(response.data)
        if (this.access.status === 'NOT_REQUESTED') {
          this.access.status = 'PENDING'
          this.access.reason = this.applicationReason
        }
        this.$message.success('Your Imputation access request has been submitted.')
        this.scheduleAccessPoll(30000)
      } catch (error) {
        // The global request layer presents the server message.
      } finally {
        this.requestingAccess = false
      }
    },
    async loadWorkspace(showMessage) {
      const results = await Promise.allSettled([this.loadOptions(), this.loadTasks(false)])
      if (showMessage && results.some(result => result.status === 'fulfilled')) {
        this.$message.success('Imputation workspace refreshed.')
      }
    },
    async loadOptions() {
      this.optionsLoading = true
      this.optionsError = ''
      try {
        const response = await getImputationOptions()
        this.options = this.normalizeOptions(response.data)
        this.ensureOptionSelection()
      } catch (error) {
        this.optionsError = this.errorMessage(error, 'Reference panel options could not be loaded.')
        throw error
      } finally {
        this.optionsLoading = false
      }
    },
    normalizeOptions(payload) {
      const value = payload || {}
      const rawBuilds = value.assemblies || value.genomeBuilds || value.builds || (value.genomeBuild ? [value.genomeBuild] : [])
      const rawPanels = value.referencePanels || value.panels || []
      const rawChromosomes = value.chromosomes || value.supportedChromosomes || rawPanels.reduce((all, panel) => {
        const assembly = panel.assembly || panel.genomeBuild || panel.build || ''
        const chromosomes = panel.chromosomes || panel.supportedChromosomes || []
        chromosomes.forEach(chromosome => {
          const rawValue = typeof chromosome === 'object' ? (chromosome.value || chromosome.id || chromosome.name) : chromosome
          if (!all.some(item => String(item.value) === String(rawValue) && item.genomeBuild === assembly)) {
            all.push({ value: rawValue, label: `chr${this.stripChr(rawValue)}`, genomeBuild: assembly })
          }
        })
        return all
      }, [])
      return {
        builds: rawBuilds.map(item => this.normalizeOption(item, 'genomeBuild')),
        chromosomes: rawChromosomes.map(item => {
          const option = this.normalizeOption(item, 'chromosome')
          option.value = this.stripChr(option.value)
          option.label = /^chr/i.test(option.label) ? option.label : `chr${option.label}`
          option.genomeBuild = typeof item === 'object' && item ? (item.assembly || item.genomeBuild || item.build || '') : ''
          return option
        }),
        panels: rawPanels.map(item => {
          const option = this.normalizeOption(item, 'panel')
          const chromosomes = typeof item === 'object' && item
            ? (item.chromosomes || item.supportedChromosomes || [])
            : []
          option.genomeBuild = typeof item === 'object' && item ? (item.assembly || item.genomeBuild || item.build || '') : ''
          option.chromosomes = chromosomes.map(chromosome => this.stripChr(typeof chromosome === 'object' ? (chromosome.value || chromosome.id || chromosome.name) : chromosome))
          option.description = typeof item === 'object' && item ? (item.description || item.summary || '') : ''
          return option
        }),
        maxUploadBytes: Number(value.maxInputBytes || value.maxUploadBytes || value.maxFileSizeBytes || value.uploadLimitBytes) || null,
        maxIndexBytes: Number(value.maxIndexBytes) || null
      }
    },
    normalizeOption(item, type) {
      if (typeof item !== 'object' || item === null) {
        return { value: String(item), label: String(item) }
      }
      const value = item.value || item.id || item.code || item.name || ''
      let label = item.label || item.displayName || item.name || value
      if (type === 'panel' && item.version && !String(label).includes(item.version)) {
        label = `${label} (${item.version})`
      }
      return { value: String(value), label: String(label) }
    },
    ensureOptionSelection() {
      if (!this.options.builds.some(item => item.value === this.form.genomeBuild)) {
        this.form.genomeBuild = this.options.builds.length ? this.options.builds[0].value : ''
      }
      this.syncOptionSelection()
    },
    syncOptionSelection() {
      if (!this.availablePanels.some(item => item.value === this.form.referencePanelId)) {
        this.form.referencePanelId = this.availablePanels.length ? this.availablePanels[0].value : ''
      }
      this.$nextTick(() => {
        if (!this.availableChromosomes.some(item => item.value === this.form.chromosome)) {
          this.form.chromosome = this.availableChromosomes.length ? this.availableChromosomes[0].value : ''
        }
      })
      this.validateFiles()
    },
    chooseFile(type) {
      if (this.uploading) return
      const ref = type === 'vcf' ? this.$refs.vcfInput : this.$refs.indexInput
      if (ref) ref.click()
    },
    handleFileSelect(event, type) {
      const file = event.target.files && event.target.files[0]
      if (file) this.setFile(file, type)
    },
    handleDrop(event, type) {
      this.draggingVcf = false
      this.draggingIndex = false
      if (this.uploading) return
      const file = event.dataTransfer.files && event.dataTransfer.files[0]
      if (file) this.setFile(file, type)
    },
    setFile(file, type) {
      if (type === 'vcf') {
        this.vcfFile = file
      } else {
        this.indexFile = file
      }
      this.validateFiles()
    },
    removeFile(type) {
      if (type === 'vcf') {
        this.vcfFile = null
        if (this.$refs.vcfInput) this.$refs.vcfInput.value = ''
      } else {
        this.indexFile = null
        if (this.$refs.indexInput) this.$refs.indexInput.value = ''
      }
      this.validateFiles()
    },
    validateFiles() {
      this.fileError = ''
      this.fileWarning = ''
      if (this.vcfFile && !/\.vcf\.gz$/i.test(this.vcfFile.name)) {
        this.fileError = 'The target file must use the .vcf.gz extension and be bgzip-compressed.'
        return false
      }
      if (this.vcfFile && this.vcfFile.size <= 0) {
        this.fileError = 'The selected VCF.gz file is empty.'
        return false
      }
      if (this.vcfFile && this.maxUploadBytes && this.vcfFile.size > this.maxUploadBytes) {
        this.fileError = `The selected VCF.gz exceeds the ${this.formatFileSize(this.maxUploadBytes)} upload limit.`
        return false
      }
      if (this.vcfFile && !this.indexFile) {
        this.fileError = 'A matching .vcf.gz.tbi index is required by Minimac4.'
        return false
      }
      if (this.indexFile && !/\.tbi$/i.test(this.indexFile.name)) {
        this.fileError = 'The required Tabix index must use the .tbi extension.'
        return false
      }
      if (this.indexFile && this.options.maxIndexBytes && this.indexFile.size > this.options.maxIndexBytes) {
        this.fileError = `The selected index exceeds the ${this.formatFileSize(this.options.maxIndexBytes)} upload limit.`
        return false
      }
      if (this.vcfFile && this.indexFile && this.indexFile.name !== `${this.vcfFile.name}.tbi`) {
        this.fileError = `The index filename must be ${this.vcfFile.name}.tbi. Select the Tabix index generated for this VCF.`
        return false
      }
      return true
    },
    async submitTask() {
      if (!this.canSubmit || !this.validateFiles()) return
      this.uploading = true
      this.uploadProgress = 0
      try {
        const formData = new FormData()
        formData.append('file', this.vcfFile)
        if (this.indexFile) formData.append('indexFile', this.indexFile)
        formData.append('assembly', this.form.genomeBuild)
        formData.append('chromosome', this.form.chromosome)
        formData.append('panelCode', this.form.referencePanelId)
        const response = await createImputationTask(formData, event => {
          if (event.total) {
            this.uploadProgress = Math.min(99, Math.round((event.loaded * 100) / event.total))
          }
        })
        this.uploadProgress = 100
        const rawTask = response.data && response.data.task ? response.data.task : response.data
        const task = this.normalizeTask(rawTask)
        if (task.id) {
          this.mergeTasks([task])
          this.rememberTask(task.id)
        }
        this.removeFile('vcf')
        this.removeFile('index')
        this.statusFilter = 'ALL'
        this.$message.success('Imputation task submitted. Server-side validation has started.')
        await this.loadTasks(false)
      } catch (error) {
        // Keep selected files so a transient failure does not force reselection.
      } finally {
        this.uploading = false
        this.uploadProgress = 0
      }
    },
    async loadTasks(showMessage) {
      if (this.tasksLoading) return
      this.tasksLoading = true
      this.historyError = ''
      try {
        const response = await getImputationTasks({ page: 1, size: this.taskPageSize })
        const payload = response.data || {}
        const items = Array.isArray(payload) ? payload : (payload.items || payload.content || payload.tasks || [])
        this.totalTasks = Number(payload.total || payload.totalElements || items.length)
        this.taskPage = 1
        this.loadedTaskCount = items.length
        this.tasks = []
        this.mergeTasks(items.map(this.normalizeTask))
        await this.recoverRememberedTasks()
        this.pollFailures = 0
        this.pollWarning = ''
        if (showMessage) this.$message.success('Task history refreshed.')
        this.schedulePoll(this.activeTasks.length ? 1000 : null)
      } catch (error) {
        this.historyError = this.errorMessage(error, 'Unable to load task history.')
        this.schedulePoll(this.tasks.length ? this.pollDelay : null)
        throw error
      } finally {
        this.tasksLoading = false
      }
    },
    async loadMoreTasks() {
      if (this.tasksLoading || this.tasksLoadingMore || !this.hasMoreTasks) return
      this.tasksLoadingMore = true
      this.historyError = ''
      try {
        const nextPage = this.taskPage + 1
        const response = await getImputationTasks({ page: nextPage, size: this.taskPageSize })
        const payload = response.data || {}
        const items = Array.isArray(payload) ? payload : (payload.items || payload.content || payload.tasks || [])
        this.totalTasks = Number(payload.total || payload.totalElements || this.totalTasks)
        this.taskPage = nextPage
        this.loadedTaskCount = Math.min(this.totalTasks, this.loadedTaskCount + items.length)
        this.mergeTasks(items.map(this.normalizeTask))
      } catch (error) {
        this.historyError = this.errorMessage(error, 'Unable to load older tasks.')
      } finally {
        this.tasksLoadingMore = false
      }
    },
    async recoverRememberedTasks() {
      const knownIds = this.readRememberedTaskIds()
      const visibleIds = new Set(this.tasks.map(task => String(task.id)))
      const missingIds = knownIds.filter(id => !visibleIds.has(String(id))).slice(0, 20)
      if (!missingIds.length) return
      const results = await Promise.allSettled(missingIds.map(id => getImputationTask(id)))
      const recovered = results
        .filter(result => result.status === 'fulfilled')
        .map(result => this.normalizeTask(result.value.data))
        .filter(task => task.id)
      if (recovered.length) this.mergeTasks(recovered)
    },
    mergeTasks(incoming) {
      const byId = new Map(this.tasks.map(task => [String(task.id), task]))
      incoming.forEach(task => {
        if (!task || !task.id) return
        const key = String(task.id)
        byId.set(key, { ...(byId.get(key) || {}), ...task })
        this.rememberTask(task.id)
      })
      this.tasks = Array.from(byId.values()).sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })
    },
    normalizeTask: function(payload) {
      const value = payload || {}
      const rawStatus = String(value.status || value.taskStatus || 'PENDING').toUpperCase()
      const normalizedStatus = rawStatus === 'SUCCESS' ? 'SUCCEEDED' : rawStatus
      const status = value.cancelRequested === true && !TERMINAL_STATUSES.includes(normalizedStatus)
        ? 'CANCEL_REQUESTED'
        : normalizedStatus
      const progressValue = Number(value.progress !== undefined ? value.progress : value.progressPercent)
      return {
        ...value,
        id: value.id || value.taskId || '',
        name: value.name || value.taskName || value.analysisName || '',
        fileName: value.fileName || value.inputFilename || value.originalFilename || value.vcfFilename || '',
        genomeBuild: value.assembly || value.genomeBuild || value.build || '',
        chromosome: value.chromosome || value.chrom || '',
        referencePanelId: value.panelCode || value.referencePanelId || value.panelId || value.referencePanel || '',
        referencePanelLabel: value.panelLabel || value.referencePanelLabel || value.panelVersion || '',
        status,
        stage: String(value.stage || value.currentStage || status).toUpperCase(),
        stageLabel: value.stageLabel || '',
        progress: Number.isFinite(progressValue) ? Math.max(0, Math.min(100, Math.round(progressValue))) : (['SUCCEEDED', 'COMPLETED'].includes(status) ? 100 : 0),
        message: value.message || value.statusMessage || '',
        errorMessage: value.errorMessage || value.error || value.failureReason || '',
        errorHint: value.errorHint || value.remediation || '',
        resultReady: value.resultReady === true || value.downloadReady === true || ['SUCCEEDED', 'COMPLETED'].includes(status),
        resultFilename: value.resultFilename || value.outputFilename || '',
        createdAt: value.createdAt || value.submittedAt || value.createTime || null,
        updatedAt: value.updatedAt || value.updateTime || null
      }
    },
    schedulePoll(delay) {
      this.clearPoll()
      if (delay === null || delay === undefined || !this.hasApprovedAccess) return
      this.pollTimer = window.setTimeout(this.pollActiveTasks, delay)
    },
    scheduleAccessPoll(delay) {
      this.clearAccessPoll()
      if (delay === null || delay === undefined || document.hidden || this.access.status !== 'PENDING') return
      this.accessPollTimer = window.setTimeout(() => this.loadAccess(true), delay)
    },
    clearAccessPoll() {
      if (this.accessPollTimer) {
        window.clearTimeout(this.accessPollTimer)
        this.accessPollTimer = null
      }
    },
    clearPoll() {
      if (this.pollTimer) {
        window.clearTimeout(this.pollTimer)
        this.pollTimer = null
      }
    },
    async pollActiveTasks() {
      if (this.pollInFlight || document.hidden || !this.activeTasks.length) {
        this.schedulePoll(this.activeTasks.length ? this.pollDelay : null)
        return
      }
      this.pollInFlight = true
      try {
        const results = await Promise.allSettled(this.activeTasks.map(task => getImputationTask(task.id)))
        const updates = results
          .filter(result => result.status === 'fulfilled')
          .map(result => this.normalizeTask(result.value.data))
        if (updates.length) this.mergeTasks(updates)
        const failedCount = results.length - updates.length
        if (failedCount === results.length && results.length) throw new Error('All task refresh requests failed')
        this.pollFailures = 0
        this.pollDelay = 3000
        this.pollWarning = ''
        this.pollTick += 1
        if (this.pollTick % 10 === 0) {
          // Reconcile with the list endpoint occasionally so server-side transitions are never lost.
          const response = await getImputationTasks({ page: 1, size: this.taskPageSize })
          const payload = response.data || {}
          const items = Array.isArray(payload) ? payload : (payload.items || payload.content || payload.tasks || [])
          this.totalTasks = Number(payload.total || payload.totalElements || this.totalTasks)
          this.mergeTasks(items.map(this.normalizeTask))
        }
      } catch (error) {
        this.pollFailures += 1
        this.pollDelay = Math.min(30000, 3000 * Math.pow(2, Math.min(this.pollFailures, 4)))
        if (this.pollFailures >= 2) {
          this.pollWarning = 'Live status refresh is temporarily unavailable.'
        }
      } finally {
        this.pollInFlight = false
        this.schedulePoll(this.activeTasks.length ? this.pollDelay : null)
      }
    },
    handleVisibilityChange() {
      if (document.hidden) {
        this.clearAccessPoll()
        return
      }
      if (this.access.status === 'PENDING') this.scheduleAccessPoll(0)
      if (this.activeTasks.length) this.schedulePoll(0)
    },
    async cancelTask(task) {
      try {
        await this.$confirm('Cancel this Imputation task? A running process may take a moment to stop safely.', 'Cancel task', {
          confirmButtonText: 'Cancel task',
          cancelButtonText: 'Keep running',
          type: 'warning'
        })
      } catch (error) {
        return
      }
      this.actionTaskId = task.id
      try {
        const response = await cancelImputationTask(task.id)
        const updated = this.normalizeTask(response.data && response.data.task ? response.data.task : response.data)
        this.mergeTasks([updated.id ? updated : { ...task, status: 'CANCEL_REQUESTED', message: 'Cancellation requested.' }])
        this.$message.success('Cancellation requested.')
        this.schedulePoll(0)
      } finally {
        this.actionTaskId = ''
      }
    },
    async retryTask(task) {
      this.actionTaskId = task.id
      try {
        const response = await retryImputationTask(task.id)
        const retried = this.normalizeTask(response.data && response.data.task ? response.data.task : response.data)
        if (retried.id) {
          this.mergeTasks([retried])
          this.rememberTask(retried.id)
        }
        this.statusFilter = 'ALL'
        this.$message.success('A retry has been queued.')
        this.schedulePoll(0)
      } finally {
        this.actionTaskId = ''
      }
    },
    async downloadTask(task) {
      this.actionTaskId = task.id
      try {
        const response = await createImputationDownloadTicket(task.id)
        const payload = response.data || {}
        const target = payload.downloadUrl || payload.url || (payload.ticket
          ? `${(process.env.VUE_APP_BASE_API || '/api').replace(/\/$/, '')}/imputation-download/${encodeURIComponent(payload.ticket)}`
          : '')
        if (!target) throw new Error('The server did not return a download ticket.')
        window.location.assign(target)
      } catch (error) {
        if (!error.response) this.$message.error(this.errorMessage(error, 'Unable to prepare the result download.'))
      } finally {
        this.actionTaskId = ''
      }
    },
    canCancelTask(task) {
      if (task.cancelRequested === true || ['CANCELLING', 'CANCEL_REQUESTED'].includes(task.status)) return false
      if (typeof task.cancelAllowed === 'boolean') return task.cancelAllowed
      if (typeof task.canCancel === 'boolean') return task.canCancel
      return ACTIVE_STATUSES.includes(task.status)
    },
    canRetryTask(task) {
      if (typeof task.retryAllowed === 'boolean') return task.retryAllowed
      if (typeof task.canRetry === 'boolean') return task.canRetry
      return ['FAILED', 'CANCELLED', 'CANCELED'].includes(task.status)
    },
    canDownloadTask(task) {
      return task.resultReady && ['SUCCEEDED', 'COMPLETED'].includes(task.status)
    },
    statusClass(status) {
      if (['SUCCEEDED', 'COMPLETED'].includes(status)) return 'status-success'
      if (status === 'FAILED') return 'status-failed'
      if (['CANCELLED', 'CANCELED'].includes(status)) return 'status-cancelled'
      if (status === 'EXPIRED') return 'status-expired'
      if (['RUNNING', 'FINALIZING', 'CANCELLING', 'CANCEL_REQUESTED'].includes(status)) return 'status-running'
      if (['VALIDATING', 'UPLOADING'].includes(status)) return 'status-validating'
      return 'status-queued'
    },
    statusIcon(status) {
      if (['SUCCEEDED', 'COMPLETED'].includes(status)) return 'el-icon-circle-check'
      if (status === 'FAILED') return 'el-icon-circle-close'
      if (['CANCELLED', 'CANCELED'].includes(status)) return 'el-icon-remove-outline'
      if (status === 'EXPIRED') return 'el-icon-time'
      if (['RUNNING', 'FINALIZING', 'CANCELLING', 'CANCEL_REQUESTED'].includes(status)) return 'el-icon-loading'
      if (['VALIDATING', 'UPLOADING'].includes(status)) return 'el-icon-search'
      return 'el-icon-time'
    },
    statusLabel(status) {
      if (status === 'COMPLETED') return 'Succeeded'
      if (status === 'CANCEL_REQUESTED' || status === 'CANCELLING') return 'Cancelling'
      return this.prettyEnum(status)
    },
    stageLabel(task) {
      return task.stageLabel || this.prettyEnum(task.stage)
    },
    stageDescription(task) {
      const descriptions = {
        PENDING: 'Task created and waiting for input checks.',
        UPLOADING: 'Receiving input files.',
        VALIDATING: 'Checking VCF format and selected chromosome.',
        VALIDATING_INPUT: 'Checking VCF format and selected chromosome.',
        QUEUED: 'Waiting for an available compute slot.',
        WAITING_QUEUE: 'Waiting for an available compute slot.',
        PREPARING_INPUT: 'Preparing target and reference data.',
        RUNNING: 'Running genotype imputation.',
        RUNNING_MINIMAC: 'Running Minimac4 genotype imputation.',
        FINALIZING: 'Verifying and packaging result files.',
        CANCEL_REQUESTED: 'Waiting for the running process to stop safely.',
        CANCELLING: 'Waiting for the running process to stop safely.',
        INDEXING_RESULT: 'Indexing and packaging result files.',
        VERIFYING_RESULT: 'Verifying and packaging result files.',
        SUCCEEDED: 'Result is ready to download.',
        COMPLETED: 'Result is ready to download.',
        FAILED: 'The task could not be completed.',
        CANCELLED: 'The task was cancelled.',
        EXPIRED: 'The result retention period has ended.'
      }
      return descriptions[task.stage] || descriptions[task.status] || 'Task status is being updated.'
    },
    rememberTask(id) {
      if (!id) return
      try {
        const ids = this.readRememberedTaskIds().filter(value => String(value) !== String(id))
        ids.unshift(String(id))
        window.localStorage.setItem(this.storageKey, JSON.stringify(ids.slice(0, 50)))
      } catch (e) {
        // Server history remains authoritative when storage is disabled.
      }
    },
    readRememberedTaskIds() {
      try {
        const value = JSON.parse(window.localStorage.getItem(this.storageKey) || '[]')
        return Array.isArray(value) ? value : []
      } catch (e) {
        return []
      }
    },
    formatFileSize(bytes) {
      const value = Number(bytes)
      if (!Number.isFinite(value) || value <= 0) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
      return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
    },
    formatDate(value) {
      if (!value) return 'Time pending'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      return date.toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    },
    stripChr(value) {
      return String(value || '').replace(/^chr/i, '')
    },
    shortId(id) {
      const value = String(id || '')
      return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
    },
    prettyEnum(value) {
      return String(value || '')
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    errorMessage(error, fallback) {
      return (error && error.response && error.response.data && error.response.data.message) ||
        (error && error.message) || fallback
    }
  }
}
</script>

<style scoped>
.imputation-tool {
  --ink: #20345f;
  --muted: #657083;
  --line: #e3e9f2;
  --soft: #f5f8fc;
  --brand: #4f6fb8;
  --brand-dark: #334f8f;
  --accent: #ff9113;
  max-width: 1160px;
  margin: 0 auto 64px;
  color: #303744;
}

.tool-intro {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  padding: 8px 4px 28px;
  overflow: hidden;
}

.tool-intro h2,
.history-heading h3 {
  margin: 4px 0 8px;
  color: var(--ink);
  font-size: clamp(1.7rem, 3vw, 2.35rem);
  font-weight: 750;
  letter-spacing: -0.025em;
}

.tool-intro h2 {
  height: auto;
  border-radius: 0;
  background: transparent;
  line-height: 1.15;
}

.tool-intro h2::before {
  display: none;
}

.tool-intro p,
.history-heading p {
  max-width: 760px;
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.eyebrow {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.intro-mark {
  position: relative;
  flex: 0 0 138px;
  height: 74px;
  opacity: 0.8;
}

.intro-mark::before,
.intro-mark::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--brand), transparent);
  transform-origin: center;
}

.intro-mark::before { top: 25px; transform: rotate(18deg); }
.intro-mark::after { bottom: 25px; transform: rotate(-18deg); }
.intro-mark span {
  position: absolute;
  top: 50%;
  width: 13px;
  height: 13px;
  margin-top: -6px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--brand);
  box-shadow: 0 2px 8px rgba(51, 79, 143, 0.25);
}
.intro-mark span:nth-child(1) { left: 8px; }
.intro-mark span:nth-child(2) { left: 44px; top: 30%; background: var(--accent); }
.intro-mark span:nth-child(3) { right: 44px; top: 70%; }
.intro-mark span:nth-child(4) { right: 8px; background: var(--accent); }

.surface {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(41, 57, 91, 0.055);
}

.access-skeleton {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px;
}
.access-skeleton p { margin: 4px 0 0; color: var(--muted); }

.spinner,
.button-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #dce4f1;
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}
.spinner.small { width: 15px; height: 15px; border-width: 2px; }
.button-spinner { width: 15px; height: 15px; border-width: 2px; border-color: rgba(255,255,255,.45); border-top-color: #fff; }
@keyframes spin { to { transform: rotate(360deg); } }

.state-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: start;
  padding: clamp(24px, 5vw, 46px);
  border-top: 4px solid var(--brand);
  background: linear-gradient(135deg, #fff, #f7f9fd);
}
.state-card.state-pending { border-top-color: #d98b18; background: linear-gradient(135deg, #fff, #fffaf1); }
.state-card.state-rejected,
.state-card.state-error { border-top-color: #c04444; background: linear-gradient(135deg, #fff, #fff8f8); }
.state-icon,
.approved-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: var(--brand);
  background: #edf2fc;
  font-size: 1.55rem;
}
.state-pending .state-icon { color: #a8660b; background: #fff1d8; }
.state-rejected .state-icon,
.state-error .state-icon { color: #b52f2f; background: #fde8e8; }
.state-label { color: var(--brand); font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.state-copy h3 { margin: 5px 0 9px; color: var(--ink); font-size: 1.32rem; }
.state-copy > p { max-width: 720px; margin: 0; color: var(--muted); line-height: 1.6; }
.request-summary { display: flex; flex-wrap: wrap; gap: 20px 36px; margin: 20px 0 0; padding-top: 18px; border-top: 1px solid var(--line); }
.request-summary div { min-width: 180px; }
.request-summary dt { color: #8a94a6; font-size: .75rem; font-weight: 700; text-transform: uppercase; }
.request-summary dd { margin: 4px 0 0; color: #455064; line-height: 1.45; }
.review-note { display: flex; flex-direction: column; gap: 3px; margin-top: 18px; padding: 13px 15px; border-left: 3px solid #c04444; border-radius: 4px 10px 10px 4px; background: #fff; color: #6d3434; }

.access-form { max-width: 760px; margin-top: 24px; }
.access-form label { display: block; margin-bottom: 8px; color: var(--ink); font-weight: 700; }
.access-form textarea { width: 100%; min-height: 108px; padding: 13px 14px; resize: vertical; border: 1px solid #ccd6e5; border-radius: 10px; color: #303744; font: inherit; line-height: 1.5; transition: border-color .2s, box-shadow .2s; }
.access-form textarea:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(79,111,184,.12); }
.form-foot { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 10px; }
.form-foot > span { color: #8a94a6; font-size: .8rem; }

.btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 9px;
  font: inherit;
  font-size: .88rem;
  font-weight: 750;
  cursor: pointer;
  transition: transform .18s, box-shadow .18s, background .18s;
}
.btn:not(:disabled):hover { transform: translateY(-1px); }
.btn:disabled { cursor: not-allowed; opacity: .55; }
.btn.primary { color: #fff; background: linear-gradient(135deg, var(--brand), var(--brand-dark)); box-shadow: 0 7px 16px rgba(51,79,143,.2); }
.btn.secondary { color: var(--brand-dark); border-color: #cbd6e8; background: #fff; }
.btn.success { color: #fff; background: #27845c; box-shadow: 0 7px 16px rgba(39,132,92,.18); }
.btn.danger-outline { color: #ad3434; border-color: #ebc3c3; background: #fff; }

.access-approved {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 18px;
  margin-bottom: 20px;
  border-color: #cce7dc;
  background: linear-gradient(90deg, #f3fbf7, #fff);
}
.approved-icon { width: 39px; height: 39px; border-radius: 10px; color: #25805a; background: #ddf2e8; font-size: 1.25rem; }
.access-approved span { color: #226d4e; font-weight: 800; }
.access-approved p { margin: 2px 0 0; color: #64756d; font-size: .84rem; }
.text-btn { margin-left: auto; padding: 7px 4px; border: 0; color: var(--brand); background: transparent; font: inherit; font-size: .84rem; font-weight: 750; cursor: pointer; }

.workspace-grid { display: grid; grid-template-columns: minmax(0, 2.2fr) minmax(250px, .8fr); gap: 20px; }
.submission-card,
.process-card { padding: clamp(20px, 3.5vw, 32px); }
.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
.section-heading > div { display: flex; align-items: center; gap: 10px; }
.section-heading h3 { margin: 0; color: var(--ink); font-size: 1.22rem; }
.step-number { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; color: var(--brand); background: #edf2fc; font-size: .72rem; font-weight: 850; }
.loading-label { display: flex; align-items: center; gap: 7px; color: var(--muted); font-size: .8rem; }

.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 7px; }
.field.wide { grid-column: 1 / -1; }
.field > span { color: #42506a; font-size: .84rem; font-weight: 750; }
.field em { color: #9aa3b1; font-style: normal; font-weight: 500; }
.field select,
.field input,
.history-tools select { width: 100%; height: 44px; padding: 0 12px; border: 1px solid #d4dce8; border-radius: 9px; color: #303744; background: #fff; font: inherit; font-size: .9rem; }
.field select:focus,
.field input:focus,
.history-tools select:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(79,111,184,.1); }
.field select:disabled,
.field input:disabled { color: #9aa3b1; background: #f4f6f8; }
.field small { color: #8a94a6; line-height: 1.45; }

.file-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-top: 24px; }
.file-drop { position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 144px; padding: 20px 36px; border: 1.5px dashed #bdc9db; border-radius: 13px; text-align: center; background: #fafbfd; cursor: pointer; transition: border-color .2s, background .2s, transform .2s; }
.file-drop:hover,
.file-drop.dragging { border-color: var(--brand); background: #f3f6fc; transform: translateY(-1px); }
.file-drop.populated { border-style: solid; border-color: #a9d8c3; background: #f5fbf8; }
.file-drop.invalid { border-color: #d76c6c; background: #fff8f8; }
.file-icon { margin-bottom: 9px; color: var(--brand); font-size: 1.7rem; }
.file-drop.populated .file-icon { color: #27845c; }
.file-drop strong { max-width: 100%; overflow: hidden; color: var(--ink); font-size: .91rem; text-overflow: ellipsis; white-space: nowrap; }
.file-drop strong b { margin-left: 4px; color: #b73a3a; font-size: .67rem; text-transform: uppercase; }
.file-drop strong b.optional { color: #8c96a6; }
.file-drop > span { margin-top: 5px; color: #8a94a6; font-size: .77rem; line-height: 1.4; }
.remove-file { position: absolute; top: 10px; right: 10px; display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 50%; color: #8d4242; background: #f9e8e8; cursor: pointer; }

.inline-alert { display: flex; align-items: flex-start; gap: 9px; margin-top: 14px; padding: 11px 13px; border-radius: 9px; font-size: .82rem; line-height: 1.45; }
.inline-alert i { margin-top: 2px; }
.inline-alert button { margin-left: auto; padding: 0; border: 0; color: inherit; background: transparent; font-weight: 750; cursor: pointer; }
.inline-alert.danger { color: #9f2e2e; background: #fdefef; }
.inline-alert.warning { color: #80560f; background: #fff6e4; }
.input-guidance { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 14px; color: #687487; font-size: .76rem; }
.input-guidance i { margin-right: 3px; color: #2d8b63; }

.upload-progress { margin-top: 18px; padding: 15px; border: 1px solid #dce5f2; border-radius: 11px; background: #f7f9fd; }
.upload-progress > div:first-child { display: flex; justify-content: space-between; margin-bottom: 9px; color: var(--ink); font-size: .84rem; }
.upload-progress p { margin: 7px 0 0; color: #8a94a6; font-size: .75rem; }
.progress-track { height: 7px; overflow: hidden; border-radius: 99px; background: #e8edf4; }
.progress-track span { display: block; width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand), #6c8ed2, var(--accent)); transition: width .4s ease; }

.submit-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line); }
.submit-row > div { display: flex; flex-direction: column; gap: 3px; }
.submit-row strong { color: #40506c; font-size: .86rem; }
.submit-row span { color: #8a94a6; font-size: .75rem; }
.submit-btn { min-width: 172px; }

.process-card { align-self: start; background: linear-gradient(160deg, #fff, #f7f9fd); }
.section-heading.compact { margin-bottom: 20px; }
.stage-list { position: relative; margin: 0; padding: 0; list-style: none; }
.stage-list::before { content: ''; position: absolute; top: 17px; bottom: 29px; left: 15px; width: 1px; background: #d8e0ed; }
.stage-list li { position: relative; display: grid; grid-template-columns: 31px 1fr; gap: 12px; margin-bottom: 19px; }
.stage-list li > span { z-index: 1; display: grid; place-items: center; width: 31px; height: 31px; border: 1px solid #d2dced; border-radius: 50%; color: var(--brand); background: #fff; font-size: .72rem; font-weight: 800; }
.stage-list strong { color: #40506c; font-size: .86rem; }
.stage-list p { margin: 3px 0 0; color: #818b9a; font-size: .75rem; line-height: 1.4; }
.privacy-note { display: flex; gap: 10px; margin-top: 8px; padding: 13px; border-radius: 10px; color: #4e6689; background: #edf2fa; }
.privacy-note > i { margin-top: 2px; }
.privacy-note p { display: flex; flex-direction: column; gap: 2px; margin: 0; font-size: .74rem; line-height: 1.4; }

.history-section { margin-top: 42px; }
.history-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 18px; }
.history-heading h3 { font-size: 1.65rem; }
.history-tools { display: flex; gap: 9px; }
.history-tools select { width: auto; min-width: 145px; height: 40px; }
.rotating { animation: spin .85s linear infinite; }
.poll-warning { margin: 0 0 14px; }
.history-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 210px; padding: 28px; text-align: center; }
.history-empty > i { margin-bottom: 10px; color: #8194b8; font-size: 2rem; }
.history-empty h4 { margin: 8px 0 5px; color: var(--ink); }
.history-empty p { max-width: 520px; margin: 0 0 14px; color: var(--muted); line-height: 1.5; }
.error-empty > i { color: #b74444; }

.task-list { display: flex; flex-direction: column; gap: 13px; }
.history-load-more { display: flex; justify-content: center; margin-top: 18px; }
.task-card { display: grid; min-width: 0; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; padding: 21px 22px; border-left: 4px solid #8596b5; }
.task-main,
.task-stage,
.stage-copy,
.task-error > div { min-width: 0; }
.task-card.status-running { border-left-color: #4f6fb8; }
.task-card.status-validating { border-left-color: #8a6cb4; }
.task-card.status-success { border-left-color: #27845c; }
.task-card.status-failed { border-left-color: #bd4141; }
.task-card.status-cancelled { border-left-color: #8b929f; }
.task-card.status-expired { border-left-color: #9a7d58; }
.task-topline { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
.task-topline > div { display: flex; align-items: center; gap: 9px; }
.task-topline time { color: #929baa; font-size: .75rem; }
.status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; color: #4d607e; background: #edf1f6; font-size: .7rem; font-weight: 800; text-transform: uppercase; }
.status-pill.status-running { color: #365a9a; background: #e8eef9; }
.status-pill.status-validating { color: #71539b; background: #f0eafb; }
.status-pill.status-success { color: #236f50; background: #e2f3ea; }
.status-pill.status-failed { color: #a33333; background: #f9e7e7; }
.status-pill.status-cancelled { color: #626b78; background: #eceef1; }
.status-pill.status-expired { color: #725b3e; background: #f2ece4; }
.task-id { color: #939cab; font-family: Consolas, monospace; font-size: .73rem; }
.task-main h4 { margin: 12px 0 7px; color: var(--ink); font-size: 1rem; }
.task-main h4,
.task-error p { overflow-wrap: anywhere; }
.task-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.task-meta span { padding: 3px 7px; border-radius: 5px; color: #697487; background: #f3f5f8; font-size: .7rem; }
.task-stage { display: flex; align-items: flex-end; gap: 15px; margin-top: 17px; }
.stage-copy { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.stage-copy strong { color: #40506c; font-size: .82rem; }
.stage-copy span { overflow: hidden; color: #818b9a; font-size: .75rem; text-overflow: ellipsis; white-space: nowrap; }
.progress-number { color: var(--brand); font-size: .82rem; }
.task-progress { height: 5px; margin-top: 7px; }
.task-error { display: flex; gap: 9px; margin-top: 14px; padding: 11px 12px; border-radius: 8px; color: #8f3030; background: #fdf0f0; }
.task-error i { margin-top: 2px; }
.task-error strong { font-size: .78rem; }
.task-error p { margin: 2px 0 0; font-size: .76rem; line-height: 1.4; }
.task-error small { display: block; margin-top: 3px; color: #9c5b5b; }
.task-actions { display: flex; flex-direction: column; justify-content: center; align-items: stretch; gap: 8px; min-width: 142px; }

@media (max-width: 900px) {
  .workspace-grid { grid-template-columns: 1fr; }
  .process-card { display: none; }
}

@media (max-width: 700px) {
  .imputation-tool { margin-bottom: 42px; }
  .intro-mark { display: none; }
  .state-card { grid-template-columns: auto 1fr; gap: 15px; }
  .state-card > .btn { grid-column: 1 / -1; }
  .form-foot,
  .submit-row,
  .history-heading { align-items: stretch; flex-direction: column; }
  .settings-grid,
  .file-grid { grid-template-columns: 1fr; }
  .field.wide { grid-column: auto; }
  .history-tools { width: 100%; }
  .history-tools select { flex: 1; }
  .task-card { grid-template-columns: 1fr; gap: 16px; }
  .task-actions { width: 100%; min-width: 0; flex-direction: row; flex-wrap: wrap; justify-content: flex-start; }
  .task-topline { align-items: flex-start; flex-direction: column; gap: 8px; }
}

@media (max-width: 480px) {
  .state-card,
  .submission-card { padding: 20px 16px; }
  .state-icon { width: 43px; height: 43px; }
  .state-copy h3 { font-size: 1.1rem; }
  .access-approved { align-items: flex-start; }
  .access-approved .text-btn { display: none; }
  .history-tools { flex-direction: column; }
  .history-tools select { width: 100%; }
  .task-card { padding: 18px 15px; }
  .task-actions .btn { flex: 1 1 auto; }
}
</style>
