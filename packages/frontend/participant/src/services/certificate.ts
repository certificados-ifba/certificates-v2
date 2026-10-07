import { api, storageUrl } from './api'
import { buildCertificatePdf, PdfPage } from './pdf'

export interface RawCertificate {
  id: string
  key?: string
  workload?: number
  start_date?: string
  end_date?: string
  authorship_order?: string
  additional_field?: string
  created_at?: string
  activity?: {
    id?: string
    name?: string
    type?: { id?: string; name?: string }
  }
  function?: { id?: string; name?: string }
  event?: {
    id?: string
    name?: string
    initials?: string
    edition?: string
    year?: string
    start_date?: string
  }
}

interface ModelPage {
  type: string
  image?: string
  text: string
  layout?: PdfPage['layout']
}

const formatDateRange = (startDate: string, endDate: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }
  const start = new Date(startDate).toLocaleDateString('pt-BR', options)
  const end = new Date(endDate).toLocaleDateString('pt-BR', options)
  return `${start} a ${end}`
}

const substitute = (
  html: string,
  certificate: RawCertificate,
  participantName: string
) => {
  if (!html) return ''
  const tipoAtividade = certificate.activity?.type?.name || ''
  const funcao = certificate.function?.name || ''

  return html
    .replace(/\[participante_nome\]/g, participantName || '')
    .replace(/\[evento_nome\]/g, certificate.event?.name || '')
    .replace(/\[evento_sigla\]/g, certificate.event?.initials || '')
    .replace(/\[evento_edicao\]/g, certificate.event?.edition || '')
    .replace(
      /\[participacao_periodo\]/g,
      formatDateRange(certificate.start_date, certificate.end_date)
    )
    .replace(
      /\[participacao_carga_horaria\]/g,
      `${certificate.workload || ''} horas`
    )
    .replace(
      /\[participacao_ordem_autoria\]/g,
      certificate.authorship_order || ''
    )
    .replace(
      /\[participacao_texto_adicional\]/g,
      certificate.additional_field || ''
    )
    .replace(/\[tipo_atividade\]/g, tipoAtividade)
    .replace(/\[tipo_funcao\]/g, funcao)
    .replace(/\[criterioVisualizado\]/g, funcao)
}

const sanitize = (value: string) =>
  (value || 'certificado')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60)

export const certificateFilename = (certificate: RawCertificate): string =>
  `${sanitize(certificate.activity?.name)}_${certificate.key || certificate.id}`

export const isUnauthorized = (err: any): boolean =>
  err?.response?.status === 401

// Certificados com o mesmo evento, atividade e função usam o mesmo modelo
type ModelCache = Map<string, Promise<ModelPage[]>>

const fetchModelPages = async (
  certificate: RawCertificate,
  token: string
): Promise<ModelPage[]> => {
  const { data } = await api.get(`me/certificates/${certificate.id}/model`, {
    headers: { authorization: `Bearer ${token}` }
  })
  return data?.data?.model?.pages || []
}

const getModelPages = (
  certificate: RawCertificate,
  token: string,
  cache?: ModelCache
): Promise<ModelPage[]> => {
  if (!cache) return fetchModelPages(certificate, token)
  const cacheKey = [
    certificate.event?.id,
    certificate.activity?.id,
    certificate.function?.id
  ].join('|')
  if (!cache.has(cacheKey)) {
    const request = fetchModelPages(certificate, token)
    // Falha não fica no cache: o próximo certificado tenta de novo
    request.catch(() => cache.delete(cacheKey))
    cache.set(cacheKey, request)
  }
  return cache.get(cacheKey)
}

export async function buildCertificate(
  certificate: RawCertificate,
  participantName: string,
  token: string,
  modelCache?: ModelCache
): Promise<Blob> {
  const modelPages = await getModelPages(certificate, token, modelCache)

  const pages: PdfPage[] = modelPages.map(page => ({
    backgroundImageUrl: page.image ? storageUrl(page.image) : undefined,
    contentHtml: substitute(page.text, certificate, participantName),
    // Igual ao download do admin: código de validação em todas as páginas
    validationCode: certificate.key,
    layout: page.layout
  }))

  return buildCertificatePdf(pages)
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadCertificate(
  certificate: RawCertificate,
  participantName: string,
  token: string
): Promise<void> {
  const blob = await buildCertificate(certificate, participantName, token)
  saveBlob(blob, `${certificateFilename(certificate)}.pdf`)
}

export async function downloadCertificatesZip(
  certificates: RawCertificate[],
  participantName: string,
  token: string,
  zipName: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ ok: string[]; failed: string[] }> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const ok: string[] = []
  const failed: string[] = []
  const modelCache: ModelCache = new Map()
  const usedPaths = new Set<string>()

  // Nomes iguais (ex.: edições do mesmo evento) não podem se sobrescrever
  const uniquePath = (path: string) => {
    let candidate = `${path}.pdf`
    for (let copy = 2; usedPaths.has(candidate); copy++) {
      candidate = `${path}_${copy}.pdf`
    }
    usedPaths.add(candidate)
    return candidate
  }

  for (const certificate of certificates) {
    try {
      const blob = await buildCertificate(
        certificate,
        participantName,
        token,
        modelCache
      )
      const folder = sanitize(certificate.event?.name)
      zip.file(
        uniquePath(`${folder}/${certificateFilename(certificate)}`),
        blob
      )
      ok.push(certificate.id)
    } catch (err) {
      // Sessão expirada: interrompe, quem chamou manda para o login
      if (isUnauthorized(err)) throw err
      failed.push(certificate.id)
    }
    onProgress?.(ok.length + failed.length, certificates.length)
  }

  if (ok.length > 0) {
    const content = await zip.generateAsync({ type: 'blob' })
    saveBlob(content, `${sanitize(zipName)}.zip`)
  }

  return { ok, failed }
}
