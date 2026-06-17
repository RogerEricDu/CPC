<template>
  <div class="login-page">
    <div class="login-box">
      <h2>{{ registerMode ? 'Register CPC Account' : 'Login to CPC' }}</h2>
      <form @submit.prevent="handleSubmit">
        <label>
          Username
          <input v-model.trim="username" required minlength="3" maxlength="50" autocomplete="username">
        </label>

        <label v-if="registerMode">
          Email
          <input v-model.trim="email" type="email" autocomplete="email">
        </label>

        <label v-if="registerMode">
          Institution
          <input v-model.trim="institution" maxlength="255">
        </label>

        <label v-if="registerMode">
          Application reason
          <textarea v-model.trim="applicationReason" rows="4" maxlength="1000" placeholder="Briefly describe your research purpose"></textarea>
        </label>

        <label>
          Password
          <input v-model="password" type="password" required minlength="8" maxlength="128" autocomplete="current-password">
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
      registerMode: false,
      username: '',
      email: '',
      institution: '',
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
  methods: {
    async handleSubmit() {
      this.loading = true
      this.error = ''
      this.notice = ''
      try {
        if (!this.captchaId || !this.captchaCode) {
          throw new Error('Please enter the verification code.')
        }
        if (this.registerMode) {
          await register({
            username: this.username,
            email: this.email || null,
            institution: this.institution || null,
            applicationReason: this.applicationReason || null,
            password: this.password,
            captchaId: this.captchaId,
            captchaCode: this.captchaCode
          })
          this.notice = 'Registration successful. You can now log in.'
          this.registerMode = false
          this.password = ''
          this.resetCaptcha()
          return
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
      this.registerMode = !this.registerMode
      this.error = ''
      this.notice = ''
      this.resetCaptcha()
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
}

.primary {
  background: #5979c2;
  color: white;
}

.secondary {
  background: #eef2f7;
  color: #2b4275;
}

.notice {
  color: #1b7f46;
  text-align: center;
}

.error {
  color: #b42318;
  text-align: center;
}
</style>
