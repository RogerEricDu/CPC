// src/api/sv.js
import request from '@/utils/request'

/**
 * SV 数据查询接口
 */

// SV 查询接口
export function searchSV(data) {
  return request({
    url: '/sv/search',
    method: 'post',
    data
  })
}

// SV 查询接口
export function searchSNP(data) {
  return request({
    url: '/snp/search',
    method: 'post',
    data
  })
}

export function getSnpFrequency(params) {
  return request({
    url: '/snp/frequency',
    method: 'get',
    params
  })
}

export function getSvFrequency(params) {
  return request({
    url: '/sv/frequency',
    method: 'get',
    params
  })
}

export function getSnpBrowser(params) {
  return request({
    url: '/snp/browser',
    method: 'get',
    params
  })
}

export function getSvBrowser(params) {
  return request({
    url: '/sv/browser',
    method: 'get',
    params
  })
}
