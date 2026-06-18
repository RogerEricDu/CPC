<template>
  <div class="password-page">
    <div class="password-panel">
      <h2>Reset password</h2>
      <form v-if="!completed" @submit.prevent="submit">
        <label>
          New password
          <input v-model="newPassword" type="password" required minlength="8" maxlength="128" autocomplete="new-password">
        </label>
        <label>
          Confirm new password
          <input v-model="confirmPassword" type="password" required minlength="8" maxlength="128" autocomplete="new-password">
        </label>
        <button type="submit" :disabled="loading">{{ loading ? 'Updating...' : 'Reset password' }}</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <div v-else>
        <p class="notice">Your password has been reset.</p>
        <router-link to="/login">Login with the new password</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { resetPassword } from '@/api/auth'

export default {
  name: 'ResetPasswordPage',
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      loading: false,
      completed: false,
      error: ''
    }
  },
  methods: {
    async submit() {
      this.error = ''
      if (!this.$route.query.token) {
        this.error = 'This password reset link is incomplete.'
        return
      }
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Passwords do not match.'
        return
      }
      this.loading = true
      try {
        await resetPassword({
          token: this.$route.query.token,
          newPassword: this.newPassword
        })
        this.completed = true
      } catch (err) {
        this.error = err.message || 'Unable to reset the password.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped src="./password-page.css"></style>
