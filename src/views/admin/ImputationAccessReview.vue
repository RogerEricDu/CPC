<template>
  <section class="review-panel">
    <div class="review-toolbar">
      <div>
        <h3>Imputation access review</h3>
        <p>Approve managed-compute access after reviewing each applicant's research purpose.</p>
      </div>
      <div class="toolbar-actions">
        <select v-model="status" aria-label="Filter Imputation access requests" @change="changeFilter">
          <option value="PENDING">Pending review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All requests</option>
        </select>
        <button :disabled="loading" @click="loadRequests">
          <i class="el-icon-refresh" :class="{ rotating: loading }"></i> Refresh
        </button>
      </div>
    </div>

    <div v-if="error" class="review-error">
      <i class="el-icon-warning-outline"></i>
      <span>{{ error }}</span>
      <button @click="loadRequests">Try again</button>
    </div>

    <div class="request-list" :class="{ loading: loading && requests.length }">
      <article v-for="request in requests" :key="request.id || request.requestId" class="request-card">
        <div class="request-profile">
          <span class="avatar">{{ initials(request) }}</span>
          <div>
            <strong>{{ request.username || 'CPC user' }}</strong>
            <span>{{ request.email || 'No email provided' }}</span>
            <small>{{ request.institution || 'Institution not provided' }}</small>
          </div>
        </div>

        <div class="request-purpose">
          <div class="request-meta">
            <span class="status-pill" :class="statusClass(request.status)">{{ prettyStatus(request.status) }}</span>
            <time>{{ formatDate(request.requestedAt) }}</time>
          </div>
          <h4>Research purpose</h4>
          <p>{{ request.reason || 'No research purpose was included.' }}</p>
          <div v-if="request.decisionNote" class="decision-note">
            <strong>Decision note</strong>
            <span>{{ request.decisionNote }}</span>
          </div>
        </div>

        <div v-if="request.status === 'PENDING'" class="request-actions">
          <button class="reject" @click="openDecision(request, 'REJECTED')">
            <i class="el-icon-close"></i> Reject
          </button>
          <button class="approve" @click="openDecision(request, 'APPROVED')">
            <i class="el-icon-check"></i> Approve
          </button>
        </div>
      </article>

      <div v-if="loading && requests.length === 0" class="empty-state">
        <span class="spinner"></span>
        <strong>Loading access requests</strong>
      </div>
      <div v-else-if="!loading && requests.length === 0" class="empty-state">
        <i class="el-icon-circle-check"></i>
        <strong>No {{ status ? prettyStatus(status).toLowerCase() : '' }} requests</strong>
        <p>{{ status === 'PENDING' ? 'The Imputation review queue is clear.' : 'Choose another filter to view requests.' }}</p>
      </div>
    </div>

    <div v-if="total > size" class="review-pager">
      <button :disabled="page <= 1 || loading" @click="goPage(page - 1)">Previous</button>
      <span>Page {{ page }} of {{ pageCount }} · {{ total }} requests</span>
      <button :disabled="page >= pageCount || loading" @click="goPage(page + 1)">Next</button>
    </div>

    <el-dialog
      :visible.sync="dialogVisible"
      :title="decision === 'APPROVED' ? 'Approve Imputation access' : 'Reject Imputation access'"
      width="min(520px, 92vw)"
      append-to-body
      @closed="resetDialog"
    >
      <div v-if="selectedRequest" class="decision-dialog">
        <p>
          <strong>{{ selectedRequest.username }}</strong>
          <span>{{ selectedRequest.institution || selectedRequest.email || 'CPC user' }}</span>
        </p>
        <label for="decision-note">
          {{ decision === 'REJECTED' ? 'Reason for rejection' : 'Reviewer note (optional)' }}
        </label>
        <textarea
          id="decision-note"
          v-model.trim="decisionNote"
          rows="4"
          maxlength="1000"
          :placeholder="decision === 'REJECTED' ? 'Explain what the applicant should clarify before requesting again.' : 'Add any access guidance for the applicant.'"
        ></textarea>
        <small>{{ decisionNote.length }}/1000</small>
      </div>
      <span slot="footer" class="dialog-footer">
        <button class="dialog-cancel" :disabled="deciding" @click="dialogVisible = false">Cancel</button>
        <button
          class="dialog-submit"
          :class="decision === 'REJECTED' ? 'reject' : 'approve'"
          :disabled="deciding || (decision === 'REJECTED' && decisionNote.length < 3)"
          @click="submitDecision"
        >
          {{ deciding ? 'Saving…' : decision === 'APPROVED' ? 'Approve access' : 'Reject request' }}
        </button>
      </span>
    </el-dialog>
  </section>
</template>

<script>
import { decideImputationAccessRequest, getImputationAccessRequests } from '@/api/admin'

export default {
  name: 'ImputationAccessReview',
  data() {
    return {
      requests: [],
      total: 0,
      page: 1,
      size: 20,
      status: 'PENDING',
      loading: false,
      error: '',
      dialogVisible: false,
      selectedRequest: null,
      decision: '',
      decisionNote: '',
      deciding: false
    }
  },
  computed: {
    pageCount() {
      return Math.max(1, Math.ceil(this.total / this.size))
    }
  },
  created() {
    this.loadRequests()
  },
  methods: {
    async loadRequests() {
      this.loading = true
      this.error = ''
      try {
        const params = { page: this.page, size: this.size }
        if (this.status) params.status = this.status
        const response = await getImputationAccessRequests(params)
        const payload = response.data || {}
        this.requests = (payload.items || []).map(item => ({
          ...item,
          id: item.id || item.requestId,
          status: String(item.status || 'PENDING').toUpperCase()
        }))
        this.total = Number(payload.total || this.requests.length)
      } catch (error) {
        this.error = (error.response && error.response.data && error.response.data.message) || error.message || 'Failed to load Imputation access requests.'
      } finally {
        this.loading = false
      }
    },
    changeFilter() {
      this.page = 1
      this.loadRequests()
    },
    goPage(page) {
      this.page = page
      this.loadRequests()
    },
    openDecision(request, decision) {
      this.selectedRequest = request
      this.decision = decision
      this.decisionNote = ''
      this.dialogVisible = true
    },
    resetDialog() {
      if (this.deciding) return
      this.selectedRequest = null
      this.decision = ''
      this.decisionNote = ''
    },
    async submitDecision() {
      if (!this.selectedRequest || this.deciding) return
      if (this.decision === 'REJECTED' && this.decisionNote.length < 3) return
      this.deciding = true
      try {
        await decideImputationAccessRequest(this.selectedRequest.id, this.decision, this.decisionNote)
        this.$message.success(this.decision === 'APPROVED' ? 'Imputation access approved.' : 'Imputation access request rejected.')
        this.dialogVisible = false
        await this.loadRequests()
      } finally {
        this.deciding = false
      }
    },
    initials(request) {
      const value = request.username || request.email || 'CPC'
      return value.slice(0, 2).toUpperCase()
    },
    statusClass(status) {
      return `status-${String(status || '').toLowerCase()}`
    },
    prettyStatus(status) {
      return String(status || '')
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    formatDate(value) {
      if (!value) return 'Submission time unavailable'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
    }
  }
}
</script>

<style scoped>
.review-panel { margin-top: 16px; }
.review-toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; padding: 20px; border: 1px solid #e4e9f1; border-radius: 12px; background: linear-gradient(135deg, #fff, #f7f9fd); }
.review-toolbar h3 { margin: 0 0 5px; color: #2b4275; font-size: 1.25rem; }
.review-toolbar p { margin: 0; color: #697386; line-height: 1.5; }
.toolbar-actions { display: flex; gap: 9px; }
select,
button,
textarea { font: inherit; }
.toolbar-actions select { min-width: 170px; height: 40px; padding: 0 10px; border: 1px solid #ccd5e2; border-radius: 8px; color: #3e4d67; background: #fff; }
.toolbar-actions button,
.review-pager button { min-height: 40px; padding: 0 14px; border: 0; border-radius: 8px; color: #fff; background: #5979c2; font-weight: 700; cursor: pointer; }
button:disabled { opacity: .55; cursor: not-allowed; }
.rotating { animation: spin .85s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.review-error { display: flex; align-items: center; gap: 9px; margin-top: 14px; padding: 12px 14px; border-radius: 9px; color: #9e3131; background: #fdeeee; }
.review-error button { margin-left: auto; padding: 0; border: 0; color: inherit; background: transparent; font-weight: 700; cursor: pointer; }
.request-list { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; transition: opacity .2s; }
.request-list.loading { opacity: .66; pointer-events: none; }
.request-card { display: grid; grid-template-columns: minmax(190px, .75fr) minmax(300px, 1.5fr) auto; gap: 24px; align-items: start; padding: 20px; border: 1px solid #e2e7ef; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(43,66,117,.045); }
.request-profile { display: flex; gap: 11px; align-items: flex-start; }
.avatar { display: grid; place-items: center; flex: 0 0 42px; height: 42px; border-radius: 11px; color: #fff; background: linear-gradient(135deg, #5979c2, #2b4275); font-size: .78rem; font-weight: 800; }
.request-profile > div { display: flex; flex-direction: column; min-width: 0; }
.request-profile strong { overflow: hidden; color: #2b4275; text-overflow: ellipsis; }
.request-profile span,
.request-profile small { overflow: hidden; color: #6e788a; font-size: .78rem; line-height: 1.45; text-overflow: ellipsis; }
.request-meta { display: flex; align-items: center; gap: 10px; }
.request-meta time { color: #8f98a7; font-size: .72rem; }
.status-pill { display: inline-flex; padding: 3px 8px; border-radius: 999px; color: #93620c; background: #fff2d7; font-size: .68rem; font-weight: 800; text-transform: uppercase; }
.status-approved { color: #247252; background: #e1f3e9; }
.status-rejected { color: #a43434; background: #f9e5e5; }
.request-purpose h4 { margin: 12px 0 4px; color: #40506c; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
.request-purpose > p { margin: 0; color: #596477; font-size: .86rem; line-height: 1.55; white-space: pre-wrap; }
.decision-note { display: flex; flex-direction: column; margin-top: 11px; padding: 9px 11px; border-left: 3px solid #c8d2e2; background: #f6f8fb; color: #616c7e; font-size: .78rem; }
.request-actions { display: flex; flex-direction: column; gap: 8px; min-width: 105px; }
.request-actions button { display: inline-flex; justify-content: center; align-items: center; gap: 5px; min-height: 36px; padding: 0 12px; border-radius: 8px; font-weight: 750; cursor: pointer; }
.request-actions .reject { border: 1px solid #e6bdbd; color: #aa3737; background: #fff; }
.request-actions .approve { border: 0; color: #fff; background: #2e855f; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 230px; padding: 30px; border: 1px solid #e2e7ef; border-radius: 12px; color: #6a7588; background: #fafbfd; text-align: center; }
.empty-state > i { margin-bottom: 9px; color: #4c9a76; font-size: 2rem; }
.empty-state p { margin: 5px 0 0; color: #8a94a5; }
.spinner { display: inline-block; width: 25px; height: 25px; margin-bottom: 12px; border: 3px solid #dae2ef; border-top-color: #5979c2; border-radius: 50%; animation: spin .85s linear infinite; }
.review-pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 18px; color: #697386; }

.decision-dialog > p { display: flex; flex-direction: column; margin: 0 0 17px; padding: 11px 13px; border-radius: 8px; color: #657083; background: #f4f6f9; }
.decision-dialog > p strong { color: #2b4275; }
.decision-dialog label { display: block; margin-bottom: 7px; color: #40506c; font-weight: 700; }
.decision-dialog textarea { width: 100%; padding: 11px 12px; resize: vertical; border: 1px solid #ccd5e2; border-radius: 8px; color: #354158; line-height: 1.5; }
.decision-dialog textarea:focus { outline: none; border-color: #5979c2; box-shadow: 0 0 0 3px rgba(89,121,194,.12); }
.decision-dialog small { display: block; margin-top: 4px; color: #949dac; text-align: right; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 9px; }
.dialog-footer button { min-height: 38px; padding: 0 15px; border-radius: 8px; font-weight: 750; cursor: pointer; }
.dialog-cancel { border: 1px solid #d3dae5; color: #586477; background: #fff; }
.dialog-submit { border: 0; color: #fff; }
.dialog-submit.approve { background: #2e855f; }
.dialog-submit.reject { background: #b43c3c; }

@media (max-width: 900px) {
  .request-card { grid-template-columns: 1fr 1.4fr; }
  .request-actions { grid-column: 1 / -1; flex-direction: row; justify-content: flex-end; }
}
@media (max-width: 650px) {
  .review-toolbar { flex-direction: column; }
  .toolbar-actions { width: 100%; }
  .toolbar-actions select { flex: 1; min-width: 0; }
  .request-card { grid-template-columns: 1fr; gap: 16px; }
  .request-actions { grid-column: auto; justify-content: stretch; }
  .request-actions button { flex: 1; }
}
</style>
