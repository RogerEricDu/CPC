<template>
  <div>
    <h4>{{ tableName }}</h4>
    <p v-if="errorMessage" class="text-danger" role="alert">{{ errorMessage }}</p>
    <table v-else class="table table-bordered table-striped table-hover table-sm " style="width:100%">
      <thead>
        <tr class="table-dark">
          <th scope="col" v-for="c in colHeader" :key="c">{{ c }}</th>
        </tr>
      </thead>
      <tbody class="table-group-divider">
        <tr v-for="r in tdata" :key="r.name">
          <td style="word-wrap:break-word;white-space:normal;word-break:break-all;" v-for="value in r" :key="value">{{ value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'MyTable',
  props: ['jsonPath'],
  data() {
    return {
      tableName: '',
      colHeader: [],
      tdata: [],
      errorMessage: ''
    }
  },
  mounted() {
    this.getTableData()
  },
  methods: {
    async getTableData() {
      this.errorMessage = ''
      try {
        const { data } = await axios.get(this.jsonPath)
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid supplementary table response')
        }
        const [metadata, ...rows] = data
        if (!metadata || typeof metadata.tableName !== 'string' ||
            !Array.isArray(metadata.colHeader) ||
            !metadata.colHeader.every(header => typeof header === 'string') ||
            !rows.every(row => row && typeof row === 'object' && !Array.isArray(row))) {
          throw new Error('Invalid supplementary table data')
        }
        const { tableName, colHeader } = metadata
        this.tableName = tableName
        this.colHeader = colHeader
        this.tdata = rows
      } catch {
        this.tableName = ''
        this.colHeader = []
        this.tdata = []
        this.errorMessage = 'Unable to load this supplementary table.'
      }
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
