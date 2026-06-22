const VISITOR_KEY = 'cpc_visitor_id'
let lastTracked = ''

function visitorId() {
  let value = localStorage.getItem(VISITOR_KEY)
  if (!value) {
    value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(VISITOR_KEY, value)
  }
  return value
}

export function trackPageVisit(route) {
  const path = route && route.fullPath ? route.fullPath : window.location.hash.replace(/^#/, '') || '/'
  const dedupeKey = `${path}|${document.title}`
  if (lastTracked === dedupeKey) return
  lastTracked = dedupeKey

  const baseURL = process.env.VUE_APP_BASE_API || '/api'
  const payload = JSON.stringify({
    visitorId: visitorId(),
    path,
    title: document.title,
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
    // Analytics must never interfere with page navigation.
  }
}
