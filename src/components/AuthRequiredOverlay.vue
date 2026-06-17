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
          <div class="lock-icon" aria-hidden="true">🔒</div>
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
      default: 'Please log in to access this content.'
    },
    actionText: {
      type: String,
      default: 'Login'
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
  max-height: 380px;
  overflow: hidden;
  padding-bottom: 70px;
  filter: blur(0);
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 38%,
    rgba(0, 0, 0, 0.78) 55%,
    rgba(0, 0, 0, 0.34) 76%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 38%,
    rgba(0, 0, 0, 0.78) 55%,
    rgba(0, 0, 0, 0.34) 76%,
    transparent 100%
  );
}

.locked-preview::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 190px;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.24) 28%,
    rgba(255, 255, 255, 0.58) 62%,
    rgba(255, 255, 255, 0.94)
  );
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.locked-overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 170px;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.34) 32%,
    rgba(255, 255, 255, 0.72) 100%
  );
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
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
  font-size: 2.2rem;
  margin-bottom: 8px;
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
