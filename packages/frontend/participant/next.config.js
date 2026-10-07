const rawApiUri = process.env?.API_URI || 'http://localhost:4001'
const baseURL = /^https?:\/\//i.test(rawApiUri)
  ? rawApiUri
  : `https://${rawApiUri}`

// O app é servido em /participante no mesmo domínio do web (rota do Traefik)
const basePath = '/participante'

module.exports = {
  basePath,
  pageExtensions: ['page.tsx', 'page.ts'],
  typescript: {
    ignoreBuildErrors: true
  },
  env: {
    basePath,
    baseURL,
    siteKey: process.env?.HCAPTCHA_SITEKEY,
    webURL: process.env?.WEB_URL || 'http://localhost:4000'
  }
}
