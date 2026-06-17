<template>
  <div class="image-captcha">
    <div class="captcha-row">
      <button type="button" class="captcha-image" :disabled="loading" @click="refresh">
        <img v-if="imageDataUri" :src="imageDataUri" alt="Verification code">
        <span v-else>{{ loading ? 'Loading...' : 'Load code' }}</span>
      </button>
      <button type="button" class="captcha-refresh" :disabled="loading" @click="refresh">Refresh</button>
    </div>
    <input
      class="captcha-input"
      :value="value"
      maxlength="8"
      autocomplete="off"
      placeholder="Enter verification code"
      @input="handleInput"
    >
    <small v-if="error" class="captcha-error">{{ error }}</small>
  </div>
</template>

<script>
import { getCaptcha } from '@/api/auth'

export default {
  name: 'ImageCaptcha',
  props: {
    value: {
      type: String,
      default: ''
    },
    resetKey: {
      type: [Number, String],
      default: 0
    }
  },
  data() {
    return {
      imageDataUri: '',
      loading: false,
      error: ''
    }
  },
  watch: {
    resetKey() {
      this.refresh()
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    async refresh() {
      this.loading = true
      this.error = ''
      this.$emit('input', '')
      this.$emit('challenge', '')
      try {
        const response = await getCaptcha()
        this.imageDataUri = response.data.imageDataUri
        this.$emit('challenge', response.data.captchaId)
      } catch (error) {
        this.imageDataUri = ''
        this.error = 'Failed to load verification code'
        this.$emit('error', this.error)
      } finally {
        this.loading = false
      }
    },
    handleInput(event) {
      const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
      this.$emit('input', value)
    }
  }
}
</script>

<style scoped>
.image-captcha {
  display: grid;
  gap: 10px;
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.captcha-image {
  width: 100%;
  height: 58px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}

.captcha-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-refresh {
  height: 38px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  padding: 0 12px;
  cursor: pointer;
}

.captcha-input {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
}

.captcha-error {
  color: #b91c1c;
  font-weight: 700;
}
</style>
