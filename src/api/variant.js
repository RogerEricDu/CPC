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

// 根据染色体和位置范围查询 SV
export function searchSVByRegion(chromosome, start, end, page = 1, size = 10) {
  return searchSV({
    chromosome,
    start,
    end,
    page,
    size
  })
}

// 根据 SV ID 查询
export function searchSVById(uniqueId) {
  return searchSV({
    uniqueId,
    page: 1,
    size: 1
  })
}

// 根据 SV 类型查询
export function searchSVByType(SVType, population = null, page = 1, size = 10) {
  return searchSV({
    SVType,
    population,
    page,
    size
  })
}