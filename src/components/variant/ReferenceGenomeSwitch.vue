<template>
  <div class="reference-genome-switch">
    <span class="control-label">Reference genome</span>
    <div class="assembly-tabs" role="radiogroup" aria-label="Reference genome">
      <button
        v-for="assembly in assemblies"
        :key="assembly.id"
        type="button"
        role="radio"
        :aria-checked="value === assembly.id ? 'true' : 'false'"
        :class="{ active: value === assembly.id }"
        :disabled="disabled"
        @click="select(assembly.id)"
      >
        <span class="selection-dot" aria-hidden="true"></span>
        <span>{{ assembly.label }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReferenceGenomeSwitch',
  props: {
    value: { type: String, required: true },
    assemblies: { type: Array, required: true },
    disabled: { type: Boolean, default: false }
  },
  methods: {
    select(assembly) {
      if (this.disabled || !assembly || assembly === this.value) return
      this.$emit('input', assembly)
      this.$emit('change', assembly)
    }
  }
}
</script>

<style scoped>
.reference-genome-switch {
  margin-bottom: 20px;
}

.control-label {
  display: block;
  margin-bottom: 7px;
  color: #4d5c6d;
  font-weight: 600;
}

.assembly-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 5px;
  border: 1px solid #cfd9e5;
  border-radius: 8px;
  background: #edf2f7;
}

.assembly-tabs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 42px;
  padding: 9px 18px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #4b5f75;
  font-size: 0.98rem;
  font-weight: 650;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.assembly-tabs button:hover:not(:disabled):not(.active) {
  border-color: #b8c7d8;
  background: #f8fafc;
  color: #294d78;
}

.assembly-tabs button.active {
  border-color: #315f93;
  background: #315f93;
  color: #fff;
  box-shadow: 0 2px 6px rgba(37, 74, 114, 0.22);
}

.assembly-tabs button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.selection-dot {
  width: 8px;
  height: 8px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.active .selection-dot {
  background: currentColor;
  box-shadow: inset 0 0 0 1px #315f93;
}

@media (max-width: 520px) {
  .assembly-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
