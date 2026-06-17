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
      <input v-model.trim="filters.search" placeholder="Search username, email, institution">
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
            <td>{{ user.email || '-' }}</td>
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
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="9" class="empty">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <button :disabled="page <= 1" @click="goPage(page - 1)">Previous</button>
      <span>Page {{ page }} · Total {{ total }}</span>
      <button :disabled="page >= pageCount" @click="goPage(page + 1)">Next</button>
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
      error: ''
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
    phaseClass(status) {
      return {
        pending: status === 'PENDING',
        approved: status === 'APPROVED',
        rejected: status === 'REJECTED'
      }
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

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  min-width: 1100px;
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
</style>
