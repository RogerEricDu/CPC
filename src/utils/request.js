import axios from 'axios'
import { Message } from 'element-ui'
import { clearAuth, getToken } from '@/utils/auth'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (res && res.code === 200) {
      return res
    }
    const message = (res && res.message) || 'Request failed'
    Message({
      message,
      type: 'error',
      duration: 5000
    })
    return Promise.reject(new Error(message))
  },
  error => {
    let message = 'Request failed'
    if (error.response) {
      if (error.response.status === 401) {
        message = 'Please login to continue'
        clearAuth()
      } else if (error.response.status === 403) {
        message = 'Permission required'
      } else if (error.response.data && error.response.data.message) {
        message = error.response.data.message
      } else if (error.response.status === 404) {
        message = 'Resource not found'
      } else if (error.response.status >= 500) {
        message = 'Server error'
      }
    } else if (error.message && error.message.includes('timeout')) {
      message = 'Request timeout'
    } else if (error.message && error.message.includes('Network')) {
      message = 'Network connection failed'
    }

    Message({
      message,
      type: 'error',
      duration: 5000
    })

    return Promise.reject(error)
  }
)

export default service
