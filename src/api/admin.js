import request from '@/utils/request'

export function getAdminUsers(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

export function setUserAccessLevel(id, accessLevel) {
  return request({
    url: `/admin/users/${id}/access-level`,
    method: 'patch',
    data: { accessLevel }
  })
}

export function enableUser(id) {
  return request({
    url: `/admin/users/${id}/enable`,
    method: 'post'
  })
}

export function disableUser(id) {
  return request({
    url: `/admin/users/${id}/disable`,
    method: 'post'
  })
}

export function approvePhase2(id) {
  return request({
    url: `/admin/users/${id}/phase2/approve`,
    method: 'post'
  })
}

export function rejectPhase2(id) {
  return request({
    url: `/admin/users/${id}/phase2/reject`,
    method: 'post'
  })
}
