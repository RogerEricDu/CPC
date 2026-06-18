import request from '@/utils/request'

export function getDataFiles() {
  return request({
    url: '/data/files',
    method: 'get'
  })
}

export async function downloadDataFile(phase, key) {
  const baseURL = process.env.VUE_APP_BASE_API || '/api'
  const response = await request({
    url: '/data/download-ticket',
    method: 'post',
    params: { phase, key }
  })
  const downloadUrl = response.data && response.data.downloadUrl
  if (!downloadUrl) {
    throw new Error('The server did not return a download URL.')
  }
  const link = document.createElement('a')
  link.href = `${baseURL}${downloadUrl}`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
