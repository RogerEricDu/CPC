<template>
  <section class="protected-section">
    <div v-if="allowed">
      <slot />
    </div>
    <div v-else class="locked-shell">
      <div class="locked-preview">
        <slot name="preview" />
      </div>
      <div class="locked-overlay">
        <div class="lock-panel">
          <div class="lock-icon" aria-hidden="true">
            <span class="lock-glyph"></span>
          </div>
          <div class="lock-text">{{ lockedText }}</div>
          <button type="button" @click="$emit('action')">{{ actionText }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AuthRequiredOverlay',
  props: {
    allowed: {
      type: Boolean,
      default: false
    },
    lockedText: {
      type: String,
      default: '需要登录访问'
    },
    actionText: {
      type: String,
      default: '登录'
    }
  }
}
</script>

<style scoped>
.protected-section {
  position: relative;
}

.locked-shell {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.locked-preview {
  max-height: 260px;
  overflow: hidden;
  padding-bottom: 20px;
}

.locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.lock-panel {
  min-width: 260px;
  padding: 22px 26px;
  border-radius: 8px;
  border: 1px solid rgba(89, 121, 194, 0.35);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.16);
  text-align: center;
}

.lock-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.lock-glyph {
  position: relative;
  width: 28px;
  height: 24px;
  border-radius: 5px;
  background: #5979c2;
}

.lock-glyph::before {
  content: '';
  position: absolute;
  left: 6px;
  top: -14px;
  width: 16px;
  height: 18px;
  border: 4px solid #5979c2;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
}

.lock-text {
  color: #2b4275;
  font-weight: 700;
  margin-bottom: 14px;
}

button {
  border: none;
  border-radius: 6px;
  padding: 9px 22px;
  background: #5979c2;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}
</style>
