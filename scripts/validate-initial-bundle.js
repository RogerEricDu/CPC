const fs = require('fs')
const path = require('path')

const distDir = path.resolve(__dirname, '..', 'dist')
const indexPath = path.join(distDir, 'index.html')
const maximumInitialJavaScriptBytes = 2_000_000

if (!fs.existsSync(indexPath)) {
  throw new Error(`Built index is missing: ${indexPath}`)
}

const html = fs.readFileSync(indexPath, 'utf8')
const scriptSources = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi), match => match[1])
const initialAssets = scriptSources.map(source => {
  const marker = source.lastIndexOf('/js/')
  if (marker < 0) throw new Error(`Unexpected initial script URL: ${source}`)
  const file = path.join(distDir, 'js', source.slice(marker + 4))
  if (!fs.existsSync(file)) throw new Error(`Initial script is missing: ${file}`)
  return { source, bytes: fs.statSync(file).size }
})
const totalBytes = initialAssets.reduce((sum, asset) => sum + asset.bytes, 0)

if (totalBytes > maximumInitialJavaScriptBytes) {
  const detail = initialAssets.map(asset => `${asset.source}=${asset.bytes}`).join(', ')
  throw new Error(
    `Initial JavaScript budget exceeded: ${totalBytes} > ${maximumInitialJavaScriptBytes} bytes (${detail})`
  )
}

console.log(`Initial JavaScript: ${totalBytes} bytes across ${initialAssets.length} files.`)
