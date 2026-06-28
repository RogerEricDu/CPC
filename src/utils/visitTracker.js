const SESSION_KEY = 'cpc_visit_tracked'

import { getToken, isAdmin } from '@/utils/auth'

export function trackSiteVisit() {
  if (isAdmin()) return
  if (sessionStorage.getItem(SESSION_KEY)) return
  sessionStorage.setItem(SESSION_KEY, '1')

  const baseURL = process.env.VUE_APP_BASE_API || '/api'
  const payload = '{}'
  const token = getToken()

  try {
    if (!token && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon(`${baseURL}/visits/track`, blob)) return
    }
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    fetch(`${baseURL}/visits/track`, {
      method: 'POST',
      headers,
      body: payload,
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {})
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY)
  }
}
