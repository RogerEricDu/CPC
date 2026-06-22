const VISITOR_KEY = 'cpc_visitor_id'
const SESSION_KEY = 'cpc_visit_tracked'

function visitorId() {
  let value = localStorage.getItem(VISITOR_KEY)
  if (!value) {
    value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(VISITOR_KEY, value)
  }
  return value
}

export function trackSiteVisit() {
  if (sessionStorage.getItem(SESSION_KEY)) return
  sessionStorage.setItem(SESSION_KEY, '1')

  const baseURL = process.env.VUE_APP_BASE_API || '/api'
  const payload = JSON.stringify({
    visitorId: visitorId(),
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screenSize: `${window.screen.width}x${window.screen.height}`
  })

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon(`${baseURL}/visits/track`, blob)) return
    }
    fetch(`${baseURL}/visits/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {})
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY)
  }
}
