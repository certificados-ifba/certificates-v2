const rawApiUri = process.env?.API_URI || 'http://localhost:4001'
const baseURL = /^https?:\/\//i.test(rawApiUri)
  ? rawApiUri
  : `https://${rawApiUri}`

module.exports = {
  pageExtensions: ['page.tsx', 'page.ts'],
  typescript: {
    ignoreBuildErrors: true
  },
  env: {
    baseURL,
    siteKey: process.env?.HCAPTCHA_SITEKEY,
    webURL: process.env?.WEB_URL || 'http://localhost:4000'
  }
}
