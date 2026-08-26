<template>
  <div class="login-page">
    <div class="login-box">
      <h2>{{ registerMode ? 'Register CPC Account' : 'Login to CPC' }}</h2>
      <form :key="registerMode ? 'register' : 'login'" @submit.prevent="handleSubmit">
        <label>
          Username
          <input v-model.trim="username" required minlength="3" maxlength="50" autocomplete="username">
        </label>

        <label v-if="registerMode">
          Email
          <input v-model.trim="email" type="email" required autocomplete="email" placeholder="Your institutional email">
        </label>

        <label v-if="registerMode">
          PI email <span class="optional">(optional)</span>
          <input
            v-model.trim="piEmail"
            type="email"
            autocomplete="off"
            placeholder="Required for students seeking PI confirmation"
          >
          <small>
            If you are a student, enter your principal investigator's email. A separate confirmation request will be sent to your PI.
          </small>
        </label>

        <label v-if="registerMode">
          Institution
          <input v-model.trim="institution" maxlength="255">
        </label>

        <fieldset v-if="registerMode" class="requested-content-fieldset">
          <legend>Requested CPC content</legend>
          <small class="selection-note">Select one or more options.</small>
          <div class="requested-content-options">
            <label class="requested-content-option">
              <input v-model="requestedContent" type="checkbox" value="CPC_PHASE_I">
              <span>CPC Phase I</span>
            </label>
            <label class="requested-content-option">
              <input v-model="requestedContent" type="checkbox" value="CPC_PHASE_II">
              <span>CPC Phase II</span>
            </label>
            <label class="requested-content-option">
              <input v-model="requestedContent" type="checkbox" value="DATABASE">
              <span>CPC Database functions</span>
            </label>
          </div>
          <small v-if="requestedContent.includes('CPC_PHASE_I')" class="availability-note">
            CPC Phase I data can be downloaded directly without registering for an account.
          </small>
        </fieldset>

        <label v-if="registerMode">
          Application reason
          <textarea v-model.trim="applicationReason" rows="4" maxlength="1000" placeholder="Briefly describe your research purpose"></textarea>
        </label>

        <label>
          Password
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            maxlength="128"
            :autocomplete="registerMode ? 'new-password' : 'current-password'"
          >
        </label>

        <label>
          Verification
          <ImageCaptcha
            v-model="captchaCode"
            :reset-key="captchaResetKey"
            @challenge="captchaId = $event"
          />
        </label>

        <div class="actions">
          <button class="primary" type="submit" :disabled="loading">
            {{ loading ? 'Please wait...' : (registerMode ? 'Create Account' : 'Login') }}
          </button>
          <button type="button" class="secondary" :disabled="loading" @click="toggleMode">
            {{ registerMode ? 'Back to Login' : 'Register' }}
          </button>
        </div>

        <router-link v-if="!registerMode" class="forgot-link" to="/forgot-password">
          Forgot password?
        </router-link>

        <p v-if="notice" class="notice">{{ notice }}</p>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import ImageCaptcha from '@/components/ImageCaptcha.vue'
import { login, register } from '@/api/auth'
import { setAuth } from '@/utils/auth'

export default {
  name: 'LoginPage',
  components: { ImageCaptcha },
  data() {
    return {
      username: '',
      email: '',
      piEmail: '',
      institution: '',
      requestedContent: [],
      applicationReason: '',
      password: '',
      captchaId: '',
      captchaCode: '',
      captchaResetKey: 0,
      loading: false,
      error: '',
      notice: ''
    }
  },
  computed: {
    registerMode() {
      return this.$route.path === '/register'
    }
  },
  watch: {
    registerMode() {
      this.password = ''
      this.error = ''
      this.notice = ''
      this.resetCaptcha()
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true
      this.error = ''
      this.notice = ''
      try {
        if (this.registerMode) {
          if (!this.requestedContent.length) {
            throw new Error('Please select at least one requested CPC content option.')
          }
          if (!this.captchaId || !this.captchaCode) {
            throw new Error('Please enter the verification code.')
          }
          await register({
            username: this.username,
            email: this.email || null,
            piEmail: this.piEmail || null,
            institution: this.institution || null,
            requestedContent: this.requestedContent,
            applicationReason: this.applicationReason || null,
            password: this.password,
            captchaId: this.captchaId,
            captchaCode: this.captchaCode
          })
          const registrationNotice = this.requestedContent.includes('CPC_PHASE_I')
            ? 'Registration submitted. CPC Phase I data can be downloaded without an account; please also check the verification email sent to you.'
            : 'Registration submitted. Verify your email and, if provided, ask your PI to complete their confirmation. An administrator will review the account afterward.'
          this.requestedContent = []
          this.password = ''
          this.resetCaptcha()
          const redirect = this.$route.query.redirect
          await this.$router.replace({
            path: '/login',
            query: redirect ? { redirect } : {}
          })
          this.notice = registrationNotice
          return
        }
        if (!this.captchaId || !this.captchaCode) {
          throw new Error('Please enter the verification code.')
        }
        const response = await login({
          username: this.username,
          password: this.password,
          captchaId: this.captchaId,
          captchaCode: this.captchaCode
        })
        setAuth(response.data.token, response.data.user)
        const redirect = this.$route.query.redirect || '/database'
        this.$router.push(redirect)
      } catch (err) {
        this.error = err.message || 'Operation failed.'
        this.resetCaptcha()
      } finally {
        this.loading = false
      }
    },
    toggleMode() {
      const target = this.registerMode ? '/login' : '/register'
      const redirect = this.$route.query.redirect
      this.$router.push({
        path: target,
        query: redirect ? { redirect } : {}
      })
      this.error = ''
      this.notice = ''
    },
    resetCaptcha() {
      this.captchaId = ''
      this.captchaCode = ''
      this.captchaResetKey += 1
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 620px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  background: #f5f7fb;
}

.login-box {
  width: min(430px, 100%);
  padding: 32px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08);
}

h2 {
  margin: 0 0 24px;
  height: auto;
  line-height: 1.3;
  background: transparent;
  color: #2b4275;
  text-align: center;
}

h2::before {
  display: none;
}

form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 7px;
  color: #606266;
  font-weight: 600;
}

label small {
  color: #7a8494;
  font-weight: 400;
  line-height: 1.4;
}

.optional {
  color: #7a8494;
  font-size: 0.85rem;
  font-weight: 400;
}

input,
textarea {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  padding: 10px 11px;
  font: inherit;
  color: #303133;
}

textarea {
  resize: vertical;
}

.requested-content-fieldset {
  display: grid;
  gap: 9px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.requested-content-fieldset legend {
  margin: 0 0 2px;
  padding: 0;
  color: #606266;
  font-weight: 600;
}

.selection-note {
  color: #7a8494;
  line-height: 1.4;
}

.requested-content-options {
  display: grid;
  gap: 8px;
}

.requested-content-option {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 9px 11px;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  color: #303133;
  cursor: pointer;
}

.requested-content-option:hover {
  border-color: #9db0d4;
  background: #f7f9fd;
}

.requested-content-option input {
  width: auto;
  margin: 0;
  accent-color: #315aa8;
}

.availability-note {
  color: #1b6e43;
  font-weight: 600;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

button {
  border: none;
  border-radius: 6px;
  padding: 11px 16px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.16s ease, color 0.16s ease, opacity 0.16s ease;
}

.primary {
  background: #315aa8;
  color: white;
}

.primary:hover:not(:disabled) {
  background: #244985;
}

.secondary {
  border: 1px solid #9db0d4;
  background: #fff;
  color: #315aa8;
}

.secondary:hover:not(:disabled) {
  background: #e8eef9;
}

button:disabled {
  border-color: #d7dce5;
  background: #e7eaf0;
  color: #9ca3af;
  cursor: not-allowed;
}

.notice {
  color: #1b7f46;
  text-align: center;
}

.error {
  color: #b42318;
  text-align: center;
}

.forgot-link {
  justify-self: center;
  color: #2b5cab;
}
</style>
