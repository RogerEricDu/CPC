import axios from 'axios'
import request from '@/utils/request'
import { getToken } from '@/utils/auth'

export function getDataFiles() {
  return request({
    url: '/data/files',
    method: 'get'
  })
}

export async function downloadDataFile(phase, key, filename) {
  const baseURL = process.env.VUE_APP_BASE_API || '/api'
  const response = await axios.get(`${baseURL}/data/download`, {
    params: { phase, key },
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
