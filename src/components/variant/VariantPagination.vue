<template>
  <nav v-if="totalPages > 1" class="variant-pagination" aria-label="Results pagination">
    <button
      type="button"
      class="pagination-button navigation-button"
      :disabled="disabled || currentPage <= 1"
      @click="changePage(currentPage - 1)"
    >Previous</button>

    <div class="page-buttons" aria-label="Page numbers">
      <span v-for="item in pageItems" :key="item.key" class="page-item">
        <span v-if="item.ellipsis" class="page-ellipsis" aria-hidden="true">&hellip;</span>
        <button
          v-else
          type="button"
          class="pagination-button number-button"
          :class="{ active: item.page === currentPage }"
          :disabled="disabled"
          :aria-label="`Go to page ${item.page}`"
          :aria-current="item.page === currentPage ? 'page' : null"
          @click="changePage(item.page)"
        >{{ item.page }}</button>
      </span>
    </div>

    <button
      type="button"
      class="pagination-button navigation-button"
      :disabled="disabled || currentPage >= totalPages"
      @click="changePage(currentPage + 1)"
    >Next</button>

    <span class="page-summary">Page {{ currentPage }} of {{ totalPages }}</span>

    <div class="page-jump">
      <label :for="inputId">Go to</label>
      <input
        :id="inputId"
        v-model="pageInput"
        type="number"
        inputmode="numeric"
        min="1"
        :max="totalPages"
        step="1"
        placeholder="Page"
        :disabled="disabled"
        @keydown.enter.prevent="jumpToInput"
      >
      <button
        type="button"
        class="jump-button"
        :disabled="disabled || !hasInputPage"
        @click="jumpToInput"
      >Go</button>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'VariantPagination',
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      pageInput: ''
    }
  },
  computed: {
    inputId() {
      return `variant-page-input-${this._uid}`
    },
    hasInputPage() {
      return this.pageInput !== '' && Number.isFinite(Number(this.pageInput))
    },
    pageItems() {
      const total = Math.max(1, Number(this.totalPages) || 1)
      const current = Math.min(Math.max(1, Number(this.currentPage) || 1), total)

      if (total <= 9) {
        return Array.from({ length: total }, (_, index) => this.pageItem(index + 1))
      }

      let start = Math.max(2, current - 2)
      let end = Math.min(total - 1, current + 2)

      if (current <= 4) end = 6
      if (current >= total - 3) start = total - 5

      const items = [this.pageItem(1)]
      if (start > 2) items.push(this.ellipsisItem('left'))
      for (let page = start; page <= end; page++) items.push(this.pageItem(page))
      if (end < total - 1) items.push(this.ellipsisItem('right'))
      items.push(this.pageItem(total))
      return items
    }
  },
  watch: {
    currentPage() {
      this.pageInput = ''
    }
  },
  methods: {
    pageItem(page) {
      return { key: `page-${page}`, page, ellipsis: false }
    },
    ellipsisItem(position) {
      return { key: `ellipsis-${position}`, ellipsis: true }
    },
    changePage(page) {
      if (this.disabled) return
      const target = Math.min(
        Math.max(1, Math.trunc(Number(page) || 1)),
        this.totalPages
      )
      this.pageInput = ''
      if (target !== this.currentPage) this.$emit('change', target)
    },
    jumpToInput() {
      if (!this.hasInputPage) return
      this.changePage(this.pageInput)
    }
  }
}
</script>

<style scoped>
.variant-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 26px 0;
}

.page-buttons,
.page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-item {
  display: inline-flex;
}

.pagination-button,
.jump-button {
  height: 38px;
  border: 1px solid #315f93;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.navigation-button,
.jump-button {
  padding: 0 15px;
  background: #315f93;
  color: #fff;
}

.navigation-button:hover:not(:disabled),
.jump-button:hover:not(:disabled) {
  border-color: #244a75;
  background: #244a75;
}

.number-button {
  min-width: 38px;
  padding: 0 9px;
  background: #fff;
  color: #315f93;
}

.number-button:hover:not(:disabled),
.number-button.active {
  background: #315f93;
  color: #fff;
}

.pagination-button:disabled,
.jump-button:disabled {
  border-color: #d4dae2;
  background: #e8edf3;
  color: #9aa6b5;
  cursor: not-allowed;
}

.page-ellipsis {
  min-width: 26px;
  color: #68788c;
  line-height: 38px;
  text-align: center;
}

.page-summary {
  margin: 0 4px;
  color: #536277;
  font-weight: 500;
  white-space: nowrap;
}

.page-jump label {
  color: #536277;
  font-weight: 500;
  white-space: nowrap;
}

.page-jump input {
  width: 82px;
  height: 38px;
  padding: 0 9px;
  border: 1px solid #aeb9c7;
  border-radius: 5px;
  color: #263c5c;
  text-align: center;
}

.page-jump input:focus {
  border-color: #315f93;
  box-shadow: 0 0 0 2px rgba(49, 95, 147, 0.15);
  outline: none;
}

.page-jump input:disabled {
  background: #eef1f5;
  color: #9aa6b5;
}

@media (max-width: 768px) {
  .variant-pagination {
    gap: 8px;
  }

  .page-buttons {
    order: 3;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-summary,
  .page-jump {
    order: 4;
  }
}
</style>
