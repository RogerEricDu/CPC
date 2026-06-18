<template>
  <div class="account-page">
    <section class="account-panel">
      <h2>Account security</h2>
      <p>Change the password for {{ currentUser && currentUser.username }}.</p>
      <form @submit.prevent="submit">
        <label>
          Current password
          <input v-model="currentPassword" type="password" required autocomplete="current-password">
        </label>
        <label>
          New password
          <input v-model="newPassword" type="password" required minlength="8" maxlength="128" autocomplete="new-password">
        </label>
        <label>
          Confirm new password
          <input v-model="confirmPassword" type="password" required minlength="8" maxlength="128" autocomplete="new-password">
        </label>
        <button type="submit" :disabled="loading">{{ loading ? 'Updating...' : 'Change password' }}</button>
        <p v-if="notice" class="notice">{{ notice }}</p>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </section>
  </div>
</template>

<script>
import { changePassword } from '@/api/auth'
import { getCurrentUser } from '@/utils/auth'

export default {
  name: 'AccountPage',
  data() {
    return {
      currentUser: getCurrentUser(),
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
      notice: '',
      error: ''
    }
  },
  methods: {
    async submit() {
      this.notice = ''
      this.error = ''
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Passwords do not match.'
        return
      }
      this.loading = true
      try {
        await changePassword({
          currentPassword: this.currentPassword,
          newPassword: this.newPassword
        })
        this.notice = 'Password changed successfully.'
        this.currentPassword = ''
        this.newPassword = ''
        this.confirmPassword = ''
      } catch (err) {
        this.error = err.message || 'Unable to change the password.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.account-page {
  min-height: 520px;
  padding: 36px 16px;
  background: #f5f7fb;
}

.account-panel {
  width: min(520px, 100%);
  margin: 0 auto;
  padding: 32px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

h2 {
  height: auto;
  margin: 0 0 8px;
  background: transparent;
  color: #2b4275;
  line-height: 1.3;
}

h2::before {
  display: none;
}

.account-panel > p {
  color: #606266;
}

form,
label {
  display: grid;
  gap: 14px;
}

label {
  gap: 7px;
  color: #606266;
  font-weight: 600;
}

input {
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  padding: 10px 11px;
  font: inherit;
}

button {
  min-height: 42px;
  border: none;
  border-radius: 6px;
  background: #5979c2;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.notice {
  color: #1b7f46;
}

.error {
  color: #b42318;
}
</style>
