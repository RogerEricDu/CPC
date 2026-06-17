import axios from 'axios'
import request from '@/utils/request'
import { getToken } from '@/utils/auth'

export function uploadImputation(formData) {
  return request({
    url: '/imputation/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000
  })
}

export function getImputationStatus(taskId) {
  return request({
    url: `/imputation/status/${taskId}`,
    method: 'get'
  })
}

export async function downloadImputationResult(taskId, filename) {
  const baseURL = process.env.VUE_APP_BASE_API || '/api'
  const response = await axios.get(`${baseURL}/imputation/download/${taskId}`, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename || `imputation_result_${taskId}.vcf.gz`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
