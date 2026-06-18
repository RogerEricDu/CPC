import request from '@/utils/request'

export function getCaptcha() {
  return request({
    url: '/auth/captcha',
    method: 'get'
  })
}

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function verifyEmail(token) {
  return request({
    url: '/auth/email/verify',
    method: 'get',
    params: { token }
  })
}

export function forgotPassword(data) {
  return request({
    url: '/auth/password/forgot',
    method: 'post',
    data
  })
}

export function resetPassword(data) {
  return request({
    url: '/auth/password/reset',
    method: 'post',
    data
  })
}

export function changePassword(data) {
  return request({
    url: '/auth/password/change',
    method: 'post',
    data
  })
}

export function getMe() {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

export function applyPhase2(data) {
  return request({
    url: '/auth/phase2/apply',
    method: 'post',
    data
  })
}
