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
