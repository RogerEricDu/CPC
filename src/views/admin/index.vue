<template>
  <div class="admin-page">
    <div class="admin-header">
      <div>
        <h1>Admin</h1>
        <p>{{ activeDescription }}</p>
      </div>
      <button class="btn btn-primary" type="button" @click="refreshActive">Refresh</button>
    </div>

    <nav class="admin-tabs" aria-label="Admin sections">
      <button :class="{ active: activeView === 'accounts' }" type="button" @click="selectView('accounts')">
        <i class="el-icon-user"></i> Account management
      </button>
      <button :class="{ active: activeView === 'analytics' }" type="button" @click="selectView('analytics')">
        <i class="el-icon-data-analysis"></i> Visit analytics
      </button>
      <button :class="{ active: activeView === 'imputation' }" type="button" @click="selectView('imputation')">
        <i class="el-icon-cpu"></i> Imputation access
      </button>
    </nav>

    <section v-if="activeView === 'accounts'">
    <form class="filters" @submit.prevent="searchUsers">
      <input v-model.trim="filters.search" placeholder="Search username, applicant email, PI email, institution">
      <select v-model="filters.accessLevel">
        <option value="">All access levels</option>
        <option value="BASIC">BASIC</option>
        <option value="PHASE2">PHASE2</option>
      </select>
      <select v-model="filters.phase2Status">
        <option value="">All Phase II statuses</option>
        <option value="NOT_REQUESTED">NOT_REQUESTED</option>
        <option value="PENDING">PENDING</option>
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
      </select>
      <select v-model="filters.enabled">
        <option value="">All accounts</option>
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
      <button class="btn btn-primary" type="submit">Search</button>
    </form>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="table-wrap">
      <table>
        <colgroup>
          <col class="col-user">
          <col class="col-email">
          <col class="col-pi-email">
          <col class="col-institution">
          <col class="col-reason">
          <col class="col-access">
          <col class="col-phase">
          <col class="col-enabled">
          <col class="col-created">
          <col class="col-actions">
        </colgroup>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>PI email</th>
            <th>Institution</th>
            <th class="reason-col">Reason</th>
            <th>Access</th>
            <th>Phase II</th>
            <th>Enabled</th>
            <th>Created</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="user-cell">
              <strong>{{ user.displayName || user.username }}</strong>
              <small>{{ user.username }} · {{ user.role }}</small>
            </td>
            <td class="email-cell">
              <span class="address">{{ user.email || '-' }}</span>
              <small :class="verificationClass(user.emailVerified)">
                {{ user.emailVerified ? 'Verified' : 'Not verified' }}
              </small>
            </td>
            <td class="email-cell">
              <span class="address">{{ user.piEmail || '-' }}</span>
              <small v-if="user.piEmail" :class="verificationClass(user.piEmailVerified)">
                {{ user.piEmailVerified ? 'Verified' : 'Not verified' }}
              </small>
              <small v-else>Not provided</small>
            </td>
            <td>{{ user.institution || '-' }}</td>
            <td class="reason">{{ user.applicationReason || '-' }}</td>
            <td class="status-cell"><span class="pill">{{ user.accessLevel }}</span></td>
            <td class="status-cell"><span class="pill" :class="phaseClass(user.phase2Status)">{{ user.phase2Status }}</span></td>
            <td class="enabled-cell">{{ user.enabled ? 'Yes' : 'No' }}</td>
            <td class="created-cell">{{ formatDate(user.createdAt) }}</td>
            <td class="actions-cell">
              <div class="actions-list">
                <button
                  v-if="user.accessLevel === 'PHASE2' && user.role !== 'ADMIN'"
                  class="btn btn-mini btn-quiet"
                  type="button"
                  title="Revoke Phase II access while keeping the account active"
                  @click="setLevel(user, 'BASIC')"
                >Set BASIC</button>
                <button
                  v-if="user.accessLevel !== 'PHASE2' && user.phase2Status !== 'PENDING'"
                  class="btn btn-mini btn-primary"
                  type="button"
                  title="Grant Phase II access directly"
                  @click="setLevel(user, 'PHASE2')"
                >Grant P2</button>
                <button
                  v-if="user.phase2Status === 'PENDING'"
                  class="btn btn-mini btn-success"
                  type="button"
                  title="Approve this Phase II access request"
                  @click="approve(user)"
                >Approve P2</button>
                <button
                  v-if="user.phase2Status === 'PENDING' && user.role !== 'ADMIN'"
                  class="btn btn-mini btn-warning"
                  type="button"
                  title="Reject only the Phase II request; the BASIC account remains active"
                  @click="reject(user)"
                >Reject P2</button>
                <button
                  v-if="!user.enabled"
                  class="btn btn-mini btn-success"
                  type="button"
                  title="Enable this account"
                  @click="enable(user)"
                >Enable account</button>
                <button
                  v-if="user.enabled && user.role !== 'ADMIN'"
                  class="btn btn-mini btn-danger"
                  type="button"
                  title="Disable the entire account and block login"
                  @click="disable(user)"
                >Disable account</button>
                <button
                  v-if="user.email"
                  class="btn btn-mini btn-email"
                  type="button"
                  @click="openEmail(user)"
                >Email</button>
                <button
                  v-if="user.role !== 'ADMIN'"
                  class="btn btn-mini btn-delete"
                  type="button"
                  title="Delete this account"
                  @click="deleteAccount(user)"
                >Delete account</button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="10" class="empty">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <button class="btn btn-quiet" :disabled="page <= 1" @click="goPage(page - 1)">Previous</button>
      <span>Page {{ page }} · Total {{ total }}</span>
      <button class="btn btn-quiet" :disabled="page >= pageCount" @click="goPage(page + 1)">Next</button>
    </div>
    </section>

    <ImputationAccessReview v-else-if="activeView === 'imputation'" ref="imputationReview" />
    <VisitAnalytics v-else ref="visitAnalytics" />

    <div v-if="emailDialog.open" class="dialog-backdrop" @click.self="closeEmail">
      <section class="email-dialog" role="dialog" aria-modal="true" aria-labelledby="email-dialog-title">
        <div class="dialog-header">
          <div>
            <h3 id="email-dialog-title">Email {{ emailDialog.user.displayName || emailDialog.user.username }}</h3>
            <p>{{ emailDialog.user.email }}</p>
          </div>
          <button type="button" class="close-button" title="Close" @click="closeEmail">×</button>
        </div>

        <label>
          Template
          <select v-model="emailDialog.template" @change="applyEmailTemplate">
            <option value="more-info">Additional information required</option>
            <option value="not-approved">Account application not approved</option>
            <option value="phase2-info">Phase II request clarification</option>
            <option value="custom">Custom message</option>
          </select>
        </label>

        <label>
          Subject
          <input v-model.trim="emailDialog.subject" maxlength="160">
        </label>

        <label>
          Message
          <textarea v-model.trim="emailDialog.message" rows="10" maxlength="5000"></textarea>
        </label>

        <p v-if="emailDialog.error" class="dialog-error">{{ emailDialog.error }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-quiet" :disabled="emailDialog.sending" @click="closeEmail">Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="emailDialog.sending" @click="sendEmail">
            {{ emailDialog.sending ? 'Sending...' : 'Send email' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import {
  approvePhase2,
  deleteUser,
  disableUser,
  enableUser,
  getAdminUsers,
  rejectPhase2,
  sendUserEmail,
  setUserAccessLevel
} from '@/api/admin'
import VisitAnalytics from './VisitAnalytics.vue'
import ImputationAccessReview from './ImputationAccessReview.vue'

export default {
  name: 'AdminPage',
  components: { ImputationAccessReview, VisitAnalytics },
  data() {
    const requestedView = String(this.$route.query.section || '').toLowerCase()
    return {
      activeView: ['imputation', 'analytics'].includes(requestedView) ? requestedView : 'accounts',
      users: [],
      total: 0,
      page: 1,
      size: 10,
      filters: {
        search: '',
        accessLevel: '',
        phase2Status: '',
        enabled: ''
      },
      error: '',
      emailDialog: {
        open: false,
        user: null,
        template: 'more-info',
        subject: '',
        message: '',
        sending: false,
        error: ''
      }
    }
  },
  computed: {
    activeDescription() {
      return {
        accounts: 'Manage user access, approvals, email communication, and account status.',
        imputation: 'Review access requests for the managed Imputation compute service.',
        analytics: 'Review CPC Data Portal traffic and usage analytics.'
      }[this.activeView]
    },
    pageCount() {
      return Math.max(1, Math.ceil(this.total / this.size))
    }
  },
  created() {
    this.loadUsers()
  },
  methods: {
    selectView(view) {
      if (!['accounts', 'imputation', 'analytics'].includes(view) || this.activeView === view) return
      this.activeView = view
      const query = { ...this.$route.query }
      if (view === 'accounts') {
        delete query.section
      } else {
        query.section = view
      }
      this.$router.replace({ path: this.$route.path, query }).catch(() => {})
    },
    refreshActive() {
      if (this.activeView === 'analytics') {
        return this.$refs.visitAnalytics && this.$refs.visitAnalytics.refresh()
      }
      if (this.activeView === 'imputation') {
        return this.$refs.imputationReview && this.$refs.imputationReview.loadRequests()
      }
      return this.loadUsers()
    },
    async loadUsers() {
      this.error = ''
      try {
        const params = {
          page: this.page,
          size: this.size
        }
        Object.keys(this.filters).forEach(key => {
          if (this.filters[key] !== '') {
            params[key] = this.filters[key]
          }
        })
        const response = await getAdminUsers(params)
        this.users = response.data.items || []
        this.total = response.data.total || 0
      } catch (err) {
        this.error = err.message || 'Failed to load users.'
      }
    },
    searchUsers() {
      this.page = 1
      this.loadUsers()
    },
    goPage(page) {
      this.page = page
      this.loadUsers()
    },
    async setLevel(user, level) {
      await setUserAccessLevel(user.id, level)
      await this.loadUsers()
    },
    async approve(user) {
      await approvePhase2(user.id)
      await this.loadUsers()
    },
    async reject(user) {
      await rejectPhase2(user.id)
      await this.loadUsers()
    },
    async enable(user) {
      await enableUser(user.id)
      await this.loadUsers()
    },
    async disable(user) {
      await disableUser(user.id)
      await this.loadUsers()
    },
    async deleteAccount(user) {
      const label = user.displayName || user.username
      const confirmed = window.confirm(`Delete account "${label}"? This cannot be undone.`)
      if (!confirmed) return
      await deleteUser(user.id)
      this.$message.success('Account deleted.')
      if (this.users.length === 1 && this.page > 1) {
        this.page -= 1
      }
      await this.loadUsers()
    },
    openEmail(user) {
      this.emailDialog.open = true
      this.emailDialog.user = user
      this.emailDialog.template = 'more-info'
      this.emailDialog.error = ''
      this.applyEmailTemplate()
    },
    closeEmail() {
      if (this.emailDialog.sending) return
      this.emailDialog.open = false
      this.emailDialog.user = null
    },
    applyEmailTemplate() {
      const templates = {
        'more-info': {
          subject: 'Additional information required for your CPC account application',
          message: 'Thank you for submitting an application for access to the CPC Data Portal. To complete our review, we require additional information regarding your institutional affiliation, research objectives, and, where applicable, the contact details of your principal investigator or supervisor.\n\nPlease reply with the requested information at your earliest convenience. Your application will be reconsidered once the additional materials have been received.'
        },
        'not-approved': {
          subject: 'Decision regarding your CPC account application',
          message: 'Thank you for your interest in the CPC Data Portal. Following review of the information currently available, we are unable to approve your account application at this time.\n\nIf you wish to request reconsideration, please reply with complete institutional details, a clear description of the proposed research, and any relevant principal investigator or supervisor information.'
        },
        'phase2-info': {
          subject: 'Additional information required for CPC Phase II access',
          message: 'Thank you for submitting a request for access to CPC Phase II data. Before a decision can be made, we require a more detailed description of the research project, the specific data requested, the intended analyses, and the supervising principal investigator or responsible investigator.\n\nPlease provide the requested information by replying to this message. The access request will remain pending until the review materials are complete.'
        }
      }
      const template = templates[this.emailDialog.template]
      if (template) {
        this.emailDialog.subject = template.subject
        this.emailDialog.message = template.message
      } else if (this.emailDialog.template === 'custom') {
        this.emailDialog.subject = ''
        this.emailDialog.message = ''
      }
    },
    async sendEmail() {
      this.emailDialog.error = ''
      this.emailDialog.sending = true
      try {
        await sendUserEmail(this.emailDialog.user.id, {
          subject: this.emailDialog.subject,
          message: this.emailDialog.message
        })
        this.$message.success('Email sent.')
        this.emailDialog.open = false
      } catch (err) {
        this.emailDialog.error = err.message || 'Failed to send email.'
      } finally {
        this.emailDialog.sending = false
      }
    },
    phaseClass(status) {
      return {
        pending: status === 'PENDING',
        approved: status === 'APPROVED',
        rejected: status === 'REJECTED'
      }
    },
    verificationClass(verified) {
      return verified ? 'verified' : 'unverified'
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString() : '-'
    }
  }
}
</script>

<style scoped>
.admin-page {
  padding: 24px 0 44px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 0 2px 16px;
  margin-bottom: 4px;
  border-bottom: 1px solid #e4e7ed;
}

.admin-tabs {
  display: inline-flex;
  gap: 5px;
  margin: 16px 0;
  padding: 5px;
  border: 1px solid #dbe2ed;
  border-radius: 8px;
  background: #f3f6fa;
}

.admin-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 7px 16px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #475467;
  cursor: pointer;
  font-weight: 700;
}

.admin-tabs button.active {
  background: #315aa8;
  color: #fff;
  box-shadow: 0 5px 14px rgba(49, 90, 168, 0.2);
}

.admin-header h1 {
  margin: 0 0 5px;
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.15;
}

p {
  margin: 0;
  color: #606266;
}

.filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 170px 210px 150px auto;
  gap: 10px;
  padding: 16px;
  margin-bottom: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

input,
select {
  min-height: 38px;
  border-radius: 5px;
  border: 1px solid #dcdfe6;
  padding: 0 10px;
}

.btn {
  min-height: 38px;
  padding: 7px 13px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  line-height: 1.15;
  transition: filter 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.btn:hover:not(:disabled) {
  filter: brightness(0.92);
}

.btn:disabled {
  border-color: #d7dce5;
  background: #e7eaf0;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-primary {
  background: #315aa8;
  color: #fff;
}

.btn-success {
  background: #177245;
  color: #fff;
}

.btn-warning {
  background: #c46812;
  color: #fff;
}

.btn-danger {
  background: #a72b24;
  color: #fff;
}

.btn-email {
  background: #176b87;
  color: #fff;
}

.btn-delete {
  background: #5f2530;
  color: #fff;
}

.btn-quiet {
  border-color: #9aa8bc;
  background: #fff;
  color: #334155;
}

.btn-mini {
  min-height: 30px;
  padding: 5px 9px;
  font-size: 0.8rem;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  min-width: 1960px;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  box-sizing: border-box;
  padding: 11px 12px;
  border-bottom: 1px solid #e4e7ed;
  text-align: left;
  vertical-align: top;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: normal;
}

th {
  background: #f5f7fa;
  color: #2b4275;
}

.col-user { width: 180px; }
.col-email { width: 250px; }
.col-pi-email { width: 250px; }
.col-institution { width: 210px; }
.col-reason { width: 320px; }
.col-access { width: 110px; }
.col-phase { width: 140px; }
.col-enabled { width: 100px; }
.col-created { width: 170px; }
.col-actions { width: 300px; }

.user-cell strong,
.address {
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.email-cell {
  line-height: 1.4;
}

td small {
  display: block;
  color: #909399;
}

td small.verified {
  color: #1b7f46;
}

td small.unverified {
  color: #b42318;
  font-weight: 600;
}

.reason {
  color: #566274;
  line-height: 1.45;
  white-space: normal;
  overflow-wrap: anywhere;
}

.pill {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2f7;
  color: #303133;
  font-size: 0.82rem;
  font-weight: 700;
  max-width: 100%;
  white-space: nowrap;
}

.pending {
  background: #fff7e6;
  color: #ad6800;
}

.approved {
  background: #e8f5e8;
  color: #1b7f46;
}

.rejected {
  background: #fde8e8;
  color: #b42318;
}

.actions-cell {
  width: auto;
}

.actions-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 7px;
  width: 100%;
}

.actions-list button {
  white-space: nowrap;
}

.status-cell,
.enabled-cell {
  white-space: nowrap;
}

.created-cell {
  white-space: normal;
}

.empty,
.error {
  text-align: center;
  color: #b42318;
  padding: 20px;
}

.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
}

.email-dialog {
  width: min(620px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 24px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.24);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.dialog-header h3 {
  margin: 0 0 4px;
  color: #2b4275;
}

.dialog-header p {
  color: #606266;
}

.close-button {
  width: 36px;
  min-height: 36px;
  padding: 0;
  background: #eef2f7;
  color: #303133;
  font-size: 24px;
}

.close-button,
.secondary-button {
  border: 1px solid #cbd3df;
  border-radius: 6px;
  cursor: pointer;
}

.email-dialog label {
  display: grid;
  gap: 7px;
  margin-bottom: 14px;
  color: #606266;
  font-weight: 600;
}

.email-dialog input,
.email-dialog select,
.email-dialog textarea {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  padding: 10px 11px;
  font: inherit;
}

.email-dialog textarea {
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.secondary-button {
  background: #eef2f7;
  color: #303133;
}

.dialog-error {
  margin-bottom: 12px;
  color: #b42318;
}
</style>
