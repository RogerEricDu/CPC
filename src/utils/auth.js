const TOKEN_KEY = 'cpc_auth_token'
const USER_KEY = 'cpc_auth_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  notifyAuthChanged()
}

export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  notifyAuthChanged()
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  notifyAuthChanged()
}

export function isLoggedIn() {
  return !!getToken() && !!getCurrentUser()
}

export function hasBasicAccess(user = getCurrentUser()) {
  return !!user && user.enabled !== false && (user.role === 'ADMIN' || user.accessLevel === 'BASIC' || user.accessLevel === 'PHASE2')
}

export function hasPhase2Access(user = getCurrentUser()) {
  return !!user && user.enabled !== false && (user.role === 'ADMIN' || user.accessLevel === 'PHASE2')
}

export function isAdmin(user = getCurrentUser()) {
  return !!user && user.enabled !== false && user.role === 'ADMIN'
}

export function notifyAuthChanged() {
  window.dispatchEvent(new CustomEvent('cpc-auth-changed'))
}
