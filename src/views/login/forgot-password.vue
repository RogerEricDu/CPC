<template>
  <div class="password-page">
    <div class="password-panel">
      <h2>Forgot password</h2>
      <form @submit.prevent="submit">
        <label>
          Account email
          <input v-model.trim="email" type="email" required autocomplete="email">
        </label>
        <label>
          Verification
          <ImageCaptcha
            v-model="captchaCode"
            :reset-key="captchaResetKey"
            @challenge="captchaId = $event"
          />
        </label>
        <button type="submit" :disabled="loading">{{ loading ? 'Sending...' : 'Send reset email' }}</button>
        <p v-if="notice" class="notice">{{ notice }}</p>
        <p v-if="error" class="error">{{ error }}</p>
        <router-link to="/login">Return to login</router-link>
      </form>
    </div>
  </div>
</template>

<script>
import ImageCaptcha from '@/components/ImageCaptcha.vue'
import { forgotPassword } from '@/api/auth'

export default {
  name: 'ForgotPasswordPage',
  components: { ImageCaptcha },
  data() {
    return {
      email: '',
      captchaId: '',
      captchaCode: '',
      captchaResetKey: 0,
      loading: false,
      notice: '',
      error: ''
    }
  },
  methods: {
    async submit() {
      this.loading = true
      this.notice = ''
      this.error = ''
      try {
        await forgotPassword({
          email: this.email,
          captchaId: this.captchaId,
          captchaCode: this.captchaCode
        })
        this.notice = 'If this email belongs to a verified CPC account, a reset message has been sent.'
      } catch (err) {
        this.error = err.message || 'Unable to request a password reset.'
      } finally {
        this.loading = false
        this.captchaResetKey += 1
      }
    }
  }
}
</script>

<style scoped src="./password-page.css"></style>
