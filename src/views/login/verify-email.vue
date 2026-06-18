<template>
  <div class="verification-page">
    <div class="verification-panel">
      <div class="status-icon" :class="{ success: verified, error: error }">
        {{ verified ? '✓' : (error ? '!' : '…') }}
      </div>
      <h2>Email verification</h2>
      <p v-if="loading">Verifying this email address...</p>
      <template v-else-if="verified">
        <p>{{ message }}</p>
        <p v-if="readyForReview">All required email confirmations are complete. The account is ready for administrator review.</p>
        <p v-else>The applicant or PI may still need to complete the other email confirmation.</p>
        <router-link to="/login">Return to login</router-link>
      </template>
      <template v-else>
        <p>{{ error }}</p>
        <router-link to="/login">Return to login</router-link>
      </template>
    </div>
  </div>
</template>

<script>
import { verifyEmail } from '@/api/auth'

export default {
  name: 'EmailVerificationPage',
  data() {
    return {
      loading: true,
      verified: false,
      readyForReview: false,
      message: '',
      error: ''
    }
  },
  async created() {
    const token = this.$route.query.token
    if (!token) {
      this.loading = false
      this.error = 'This verification link is incomplete.'
      return
    }
    try {
      const response = await verifyEmail(token)
      this.verified = true
      this.readyForReview = Boolean(response.data.accountReadyForReview)
      this.message = response.data.verificationType === 'PI'
        ? 'PI email confirmation completed.'
        : 'Applicant email verification completed.'
    } catch (err) {
      this.error = err.message || 'Email verification failed.'
    } finally {
      this.loading = false
    }
  }
}
</script>

<style scoped>
.verification-page {
  min-height: 560px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  background: #f5f7fb;
}

.verification-panel {
  width: min(520px, 100%);
  padding: 34px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.status-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: #eef2f7;
  color: #5979c2;
  font-size: 30px;
  line-height: 52px;
  font-weight: 700;
}

.status-icon.success {
  background: #e8f5e8;
  color: #1b7f46;
}

.status-icon.error {
  background: #fde8e8;
  color: #b42318;
}

h2 {
  height: auto;
  margin: 0 0 16px;
  background: transparent;
  color: #2b4275;
  line-height: 1.3;
}

h2::before {
  display: none;
}

p {
  color: #606266;
  line-height: 1.6;
}
</style>
