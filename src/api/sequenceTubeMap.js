import request from '@/utils/request'

export function getSequenceTubeMapLoci() {
  return request({
    url: '/tube-map/loci',
    method: 'get'
  })
}

export function querySequenceTubeMap(data) {
  return request({
    url: '/tube-map/query',
    method: 'post',
    data,
    timeout: 75000
  })
}
