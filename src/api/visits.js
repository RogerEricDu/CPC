import request from '@/utils/request'

export function getVisitAnalytics(params) {
  return request({
    url: '/admin/visits',
    method: 'get',
    params
  })
}
