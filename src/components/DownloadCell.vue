<template>
  <span class="download-cell">
    <button
      v-if="file"
      class="download-button"
      type="button"
      :disabled="isDownloading"
      @click="$emit('download', file)"
    >
      {{ isDownloading ? 'Starting...' : file.name }}
    </button>
    <span v-else class="missing-file">Not available</span>
  </span>
</template>

<script>
export default {
  name: 'DownloadCell',
  props: {
    file: {
      type: Object,
      default: null
    },
    downloadingKey: {
      type: String,
      default: ''
    }
  },
  computed: {
    isDownloading() {
      return Boolean(this.file && this.downloadingKey === this.file.key)
    }
  }
}
</script>

<style scoped>
.download-cell {
  display: inline-flex;
  max-width: 100%;
}

.download-button {
  max-width: 100%;
  padding: 6px 10px;
  border: 1px solid #9db2dd;
  border-radius: 5px;
  background: #e9effb;
  color: #284f9e;
  cursor: pointer;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 650;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-align: left;
}

.download-button:hover:not(:disabled) {
  border-color: #5979c2;
  background: #5979c2;
  color: #fff;
}

.download-button:disabled {
  border-color: #d8dee9;
  background: #eef1f5;
  color: #9aa3b2;
  cursor: wait;
}

.missing-file {
  color: #909399;
  font-size: 0.84rem;
}
</style>
