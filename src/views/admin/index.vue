<template>
  <div class="admin-page">
    <div class="admin-header">
      <div>
        <h2>Admin</h2>
        <p>Manage CPC user access levels, Phase II approvals, and account status.</p>
      </div>
      <button @click="loadUsers">Refresh</button>
    </div>

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
      <button type="submit">Search</button>
    </form>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>PI email</th>
            <th>Institution</th>
            <th>Reason</th>
            <th>Access</th>
            <th>Phase II</th>
            <th>Enabled</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <strong>{{ user.displayName || user.username }}</strong>
              <small>{{ user.username }} · {{ user.role }}</small>
            </td>
            <td>
              <span>{{ user.email || '-' }}</span>
              <small :class="verificationClass(user.emailVerified)">
                {{ user.emailVerified ? 'Verified' : 'Not verified' }}
              </small>
            </td>
            <td>
              <span>{{ user.piEmail || '-' }}</span>
              <small v-if="user.piEmail" :class="verificationClass(user.piEmailVerified)">
                {{ user.piEmailVerified ? 'Verified' : 'Not verified' }}
              </small>
              <small v-else>Not provided</small>
            </td>
            <td>{{ user.institution || '-' }}</td>
            <td class="reason">{{ user.applicationReason || '-' }}</td>
            <td><span class="pill">{{ user.accessLevel }}</span></td>
            <td><span class="pill" :class="phaseClass(user.phase2Status)">{{ user.phase2Status }}</span></td>
            <td>{{ user.enabled ? 'Yes' : 'No' }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td class="actions-cell">
              <button v-if="user.accessLevel !== 'BASIC'" @click="setLevel(user, 'BASIC')">Set BASIC</button>
              <button v-if="user.accessLevel !== 'PHASE2'" @click="setLevel(user, 'PHASE2')">Set PHASE2</button>
              <button v-if="user.phase2Status !== 'APPROVED'" @click="approve(user)">Approve</button>
              <button v-if="user.phase2Status !== 'REJECTED' && user.role !== 'ADMIN'" @click="reject(user)">Reject</button>
              <button v-if="!user.enabled" @click="enable(user)">Enable</button>
              <button v-if="user.enabled && user.role !== 'ADMIN'" class="danger" @click="disable(user)">Disable</button>
              <button v-if="user.email" class="email-action" @click="openEmail(user)">Email</button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="10" class="empty">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <button :disabled="page <= 1" @click="goPage(page - 1)">Previous</button>
      <span>Page {{ page }} · Total {{ total }}</span>
      <button :disabled="page >= pageCount" @click="goPage(page + 1)">Next</button>
    </div>

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
          <button type="button" class="secondary-button" :disabled="emailDialog.sending" @click="closeEmail">Cancel</button>
          <button type="button" :disabled="emailDialog.sending" @click="sendEmail">
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
  disableUser,
  enableUser,
  getAdminUsers,
  rejectPhase2,
  sendUserEmail,
  setUserAccessLevel
} from '@/api/admin'

export default {
  name: 'AdminPage',
  data() {
    return {
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
    pageCount() {
      return Math.max(1, Math.ceil(this.total / this.size))
    }
  },
  created() {
    this.loadUsers()
  },
  methods: {
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
          message: 'Thank you for applying for a CPC account. We cannot complete the review yet because additional information is required.\n\nPlease reply with your institutional affiliation, research purpose, and PI or supervisor contact information when applicable. After receiving the requested details, we can review your application again.'
        },
        'not-approved': {
          subject: 'Update on your CPC account application',
          message: 'Thank you for your interest in the CPC Data Portal. We are unable to approve your account application based on the information currently provided.\n\nYou may reply to this email with additional institutional and research information if you would like the application to be reconsidered.'
        },
        'phase2-info': {
          subject: 'Additional information required for CPC Phase II access',
          message: 'We need additional information before reviewing your request for CPC Phase II access.\n\nPlease reply with a more detailed description of the research project, the data required, the intended analyses, and the supervising PI or responsible investigator.'
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
  padding: 20px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

h2 {
  margin: 0 0 6px;
  color: #2b4275;
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
select,
button {
  min-height: 38px;
  border-radius: 5px;
  border: 1px solid #dcdfe6;
  padding: 0 10px;
}

button {
  border: none;
  background: #5979c2;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

button:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.danger {
  background: #b42318;
}

.email-action {
  background: #176b87;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  min-width: 1320px;
  border-collapse: collapse;
}

th,
td {
  padding: 11px 12px;
  border-bottom: 1px solid #e4e7ed;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f5f7fa;
  color: #2b4275;
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
  max-width: 220px;
}

.pill {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2f7;
  color: #303133;
  font-size: 0.82rem;
  font-weight: 700;
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
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.actions-cell button {
  min-height: 30px;
  font-size: 0.82rem;
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
