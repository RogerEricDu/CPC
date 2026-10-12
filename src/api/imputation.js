import request from '@/utils/request'

export function getImputationAccess() {
  return request({
    url: '/imputation/access',
    method: 'get'
  })
}

export function requestImputationAccess(data) {
  return request({
    url: '/imputation/access/requests',
    method: 'post',
    data
  })
}

export function getImputationOptions() {
  return request({
    url: '/imputation/options',
    method: 'get'
  })
}

export function createImputationTask(formData, onUploadProgress) {
  return request({
    url: '/imputation/tasks',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress,
    // Uploads can be large and are additionally constrained by the server.
    timeout: 30 * 60 * 1000
  })
}

export function getImputationTasks(params) {
  return request({
    url: '/imputation/tasks',
    method: 'get',
    params
  })
}

export function getImputationTask(taskId) {
  return request({
    url: `/imputation/tasks/${encodeURIComponent(taskId)}`,
    method: 'get'
  })
}

export function cancelImputationTask(taskId) {
  return request({
    url: `/imputation/tasks/${encodeURIComponent(taskId)}/cancel`,
    method: 'post'
  })
}

export function retryImputationTask(taskId) {
  return request({
    url: `/imputation/tasks/${encodeURIComponent(taskId)}/retry`,
    method: 'post'
  })
}

export function createImputationDownloadTicket(taskId) {
  return request({
    url: `/imputation/tasks/${encodeURIComponent(taskId)}/download-ticket`,
    method: 'post'
  })
}
