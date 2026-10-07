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
    // Sem WEB_URL, links como /validate/:key ficam relativos: em produção o
    // web e o participant estão no mesmo domínio. Em dev o compose define.
    webURL: (process.env?.WEB_URL || '').replace(/\/$/, '')
  }
}
