/* // assemblies.js - 简化版，只包含2个assembly用于测试
const baseUrl = 'https://pog.fudan.edu.cn/cpc2/download'

// 只测试2个assembly: CPCERZ200001_1 和 CPCERZ200001_2
const TEST_ASSEMBLIES = [
  {
    name: 'CPCERZ200001_1',
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: 'CPCERZ200001_1-ReferenceSequenceTrack',
      adapter: {
        type: 'BgzipFastaAdapter',
        fastaLocation: {
          uri: `${baseUrl}/CPCERZ200001/CPCERZ200001.1.fa.gz`,
        },
        faiLocation: {
          uri: `${baseUrl}/CPCERZ200001/CPCERZ200001.1.fa.gz.fai`,
        },
        gziLocation: {
          uri: `${baseUrl}/CPCERZ200001/CPCERZ200001.1.fa.gz.gzi`,
        },
      },
    },
  },
  {
    name: 'CPCERZ200001_2',
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: 'CPCERZ200001_2-ReferenceSequenceTrack',
      adapter: {
        type: 'BgzipFastaAdapter',
        fastaLocation: {
          uri: `${baseUrl}/CPCERZ200001/CPCERZ200001.2.fa.gz`,
        },
        faiLocation: {
          uri: `${baseUrl}/CPCERZ200001/CPCERZ200001.2.fa.gz.fai`,
        },
        gziLocation: {
          uri: `${baseUrl}/CPCERZ200001/CPCERZ200001.2.fa.gz.gzi`,
        },
      },
    },
  }
]

export default TEST_ASSEMBLIES */
/* // assemblies.js - 使用缓存
const assemblyCache = new Map()

export function generateAssemblies(start = 1, end = 474, types = ['.1', '.2']) {
  const cacheKey = `${start}-${end}-${types.join(',')}`
  
  if (assemblyCache.has(cacheKey)) {
    return assemblyCache.get(cacheKey)
  }
  
  const baseUrl = 'https://pog.fudan.edu.cn/cpc2/download'
  const assemblies = []
  
  for (let i = start; i <= end; i++) {
    const sampleNum = i.toString().padStart(3, '0')
    const sampleName = `CPCERZ200${sampleNum}`
    
    for (const fileType of types) {
      const typeNum = fileType.replace('.', '')
      assemblies.push({
        name: `${sampleName}_${typeNum}`,
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: `${sampleName}_${typeNum}-ReferenceSequenceTrack`,
          adapter: {
            type: 'BgzipFastaAdapter',
            fastaLocation: {
              uri: `${baseUrl}/${sampleName}/${sampleName}${fileType}.fa.gz`,
            },
            faiLocation: {
              uri: `${baseUrl}/${sampleName}/${sampleName}${fileType}.fa.gz.fai`,
            },
            gziLocation: {
              uri: `${baseUrl}/${sampleName}/${sampleName}${fileType}.fa.gz.gzi`,
            },
          },
        },
      })
    }
  }
  
  assemblyCache.set(cacheKey, assemblies)
  return assemblies
}

// 默认导出所有assemblies（可能会很大）
// export default generateAssemblies(1, 474, ['.1', '.2'])

// 或者只导出部分用于测试
export default generateAssemblies(1, 10, ['.1', '.2']) // 20个用于测试 */

