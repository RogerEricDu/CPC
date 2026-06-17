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
    validateStatus: () => true,
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })

  if (response.status < 200 || response.status >= 300) {
    let message = 'Download failed.'
    if (response.status === 401) message = 'Please log in to download this file.'
    if (response.status === 403) message = 'You do not have permission to download this file.'
    if (response.status === 404) message = 'The requested file was not found on the server.'
    if (response.data && response.data.text) {
      try {
        const text = await response.data.text()
        const json = JSON.parse(text)
        if (json && json.message) message = json.message
      } catch (e) {
        // Keep the status-based message when the server returns HTML or an empty body.
      }
    }
    throw new Error(message)
  }

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
