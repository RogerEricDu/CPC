import { getToken, isAdmin } from '@/utils/auth'

const VISITOR_KEY = 'cpc_visitor_id'
const ANONYMOUS_SESSION_KEY = 'cpc_visit_tracked_v2'
const AUTHENTICATED_SESSION_KEY = 'cpc_visit_user_tracked_v2'

function visitorId() {
  let value = localStorage.getItem(VISITOR_KEY)
  if (!value) {
    value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(VISITOR_KEY, value)
  }
  return value
}

export function trackSiteVisit() {
  if (isAdmin()) return
  const token = getToken()
  const sessionKey = token ? AUTHENTICATED_SESSION_KEY : ANONYMOUS_SESSION_KEY
  if (sessionStorage.getItem(sessionKey)) return
  sessionStorage.setItem(sessionKey, '1')

  const baseURL = process.env.VUE_APP_BASE_API || '/api'
  const payload = JSON.stringify({
    visitorId: visitorId()
  })

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
    sessionStorage.removeItem(sessionKey)
  }
}
