/**
 * Shared building blocks for HTML-based PDF reports rendered through
 * `generateCertificatePdf` with `layout.mode: 'report'`.
 */

export const REPORT_GREEN = '#1f9d55'
export const REPORT_GREEN_DARK = '#167a42'

export interface IReportContext {
  /** Big title shown in the header band (e.g. event name). */
  title: string
  /** Small label on the right of the header band. */
  reportLabel: string
  generatedAt: string
  totalPages: number
  /** Inline SVG from `loadReportLogoMarkup()`. */
  logoMarkup?: string
}

export interface IReportChartItem {
  name: string
  count: number
  percent: number
  start: number
  color: string
}

export const escapeHtml = (value: string): string =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const formatReportPercentage = (value: number): string =>
  `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`

export const formatGeneratedAt = (date = new Date()): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)

/** e.g. ('relatorio_dashboard', 'Week IT') -> relatorio_dashboard_week-it_2026-10-14_11h22 */
export const buildReportFilename = (
  prefix: string,
  name?: string,
  date = new Date()
): string => {
  const slug = (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const pad = (value: number) => String(value).padStart(2, '0')
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`
  const timePart = `${pad(date.getHours())}h${pad(date.getMinutes())}`

  return [prefix, slug, datePart, timePart].filter(Boolean).join('_')
}

export const chunkRows = <T,>(rows: T[], size: number): T[][] => {
  if (!rows.length) return [[]]
  const chunks: T[][] = []
  for (let i = 0; i < rows.length; i += size)
    chunks.push(rows.slice(i, i + size))
  return chunks
}

export const reportCard = (content: string, extraStyle = ''): string =>
  `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;background:#fff;box-sizing:border-box;${extraStyle}">${content}</div>`

export const reportSectionTitle = (
  title: string,
  subtitle?: string
): string => `
  <div style="margin-bottom:12px;">
    <div style="font-size:14px;font-weight:700;color:#111827;">${escapeHtml(
      title
    )}</div>
    ${
      subtitle
        ? `<div style="font-size:11px;color:#6b7280;margin-top:3px;">${escapeHtml(
            subtitle
          )}</div>`
        : ''
    }
  </div>
`

export const reportKpi = (
  label: string,
  value: string,
  hint: string,
  color: string
): string => `
  <div style="border:1px solid #e5e7eb;border-left:4px solid ${color};border-radius:10px;padding:12px 14px;background:#fff;">
    <div style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${label}</div>
    <div style="font-size:22px;font-weight:700;color:#111827;line-height:1.2;margin-top:6px;">${value}</div>
    <div style="font-size:10px;color:#9ca3af;margin-top:2px;">${hint}</div>
  </div>
`

export const reportInfoRow = (label: string, value: string): string => `
  <div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:12px;">
    <span style="color:#6b7280;">${label}</span>
    <strong style="color:#111827;text-align:right;">${value}</strong>
  </div>
`

export const reportThStyle =
  'padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.04em;font-weight:700;'
export const reportTdStyle =
  'padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle;'

/**
 * Renders the logo to an SVG string. `react-dom/server` and the asset are
 * imported on demand so they stay out of the page bundle until export.
 */
export const loadReportLogoMarkup = async (): Promise<string> => {
  const [
    { renderToStaticMarkup },
    { LogoFull },
    { createElement }
  ] = await Promise.all([
    import('react-dom/server'),
    import('@assets'),
    import('react')
  ])

  return renderToStaticMarkup(createElement(LogoFull)).replace(
    '<svg ',
    '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block;" '
  )
}

/** Full-page frame: header band, flexible body and footer pinned to the bottom. */
export const buildReportPage = (
  ctx: IReportContext,
  pageNumber: number,
  section: string,
  body: string
): string => `
  <div style="display:flex;flex-direction:column;width:100%;height:100%;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;color:#1f2933;background:#ffffff;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 28px;background:linear-gradient(90deg, ${REPORT_GREEN_DARK}, ${REPORT_GREEN});color:#fff;">
      <div style="display:flex;align-items:center;gap:16px;min-width:0;">
        <div style="width:110px;height:28px;flex-shrink:0;">${
          ctx.logoMarkup || ''
        }</div>
        <div style="width:1px;height:30px;background:rgba(255,255,255,.35);"></div>
        <div style="min-width:0;">
          <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.85;font-weight:700;">${escapeHtml(
            section
          )}</div>
          <div style="font-size:16px;font-weight:700;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:620px;">${escapeHtml(
            ctx.title
          )}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:10px;opacity:.9;white-space:nowrap;">
        ${escapeHtml(ctx.reportLabel)}<br/>Gerado em ${ctx.generatedAt}
      </div>
    </div>
    <div style="flex:1;padding:18px 28px 0;box-sizing:border-box;overflow:hidden;">
      ${body}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:0 28px;padding:8px 0 12px;border-top:1px solid #edf0f6;font-size:10px;color:#6b7280;">
      <span>Certificados IFBA · Relatório gerado automaticamente</span>
      <span>Página <strong style="color:#374151;">${pageNumber}</strong> de ${
  ctx.totalPages
}</span>
    </div>
  </div>
`

/** Assigns colors and cumulative start offsets to rows for donut rendering. */
export const toChartItems = (
  rows: Array<{ name: string; count: number; percent: number; color?: string }>,
  palette: string[]
): IReportChartItem[] => {
  let start = 0
  return rows.map((row, index) => {
    const item = {
      name: row.name,
      count: row.count,
      percent: row.percent,
      color: row.color || palette[index % palette.length],
      start
    }
    start += row.percent
    return item
  })
}

export const buildReportDonutSvg = (
  items: IReportChartItem[],
  centerLabel: string,
  total: number
): string => {
  const radius = 120
  const center = 160
  const circumference = 2 * Math.PI * radius

  const segments = items
    .map(item => {
      const dashLength = circumference * (item.percent / 100)
      const labelAngle = ((item.start + item.percent / 2) / 100) * 360 - 90
      const labelX = center + Math.cos((labelAngle * Math.PI) / 180) * radius
      const labelY = center + Math.sin((labelAngle * Math.PI) / 180) * radius

      return `
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none"
          stroke="${item.color}" stroke-width="40"
          stroke-dasharray="${dashLength} ${circumference - dashLength}"
          stroke-dashoffset="${-circumference * (item.start / 100)}"
          transform="rotate(-90 ${center} ${center})" />
        ${
          item.percent >= 5
            ? `<text x="${labelX.toFixed(2)}" y="${labelY.toFixed(
                2
              )}" fill="#ffffff"
          font-size="13" font-weight="700" text-anchor="middle" dominant-baseline="middle">${Math.round(
            item.percent
          )}%</text>`
            : ''
        }
      `
    })
    .join('')

  return `
    <svg viewBox="0 0 320 320" width="100%" height="100%" role="img" aria-label="${escapeHtml(
      centerLabel
    )}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#ECECF2" stroke-width="40" />
      ${segments}
      <text x="160" y="152" fill="#111827" font-size="30" font-weight="700" text-anchor="middle" dominant-baseline="middle">${total}</text>
      <text x="160" y="182" fill="#6b7280" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="middle">${escapeHtml(
        centerLabel
      )}</text>
    </svg>
  `
}

/** Donut + table with proportion bars. */
export const buildDistributionTable = (items: IReportChartItem[]): string => `
  <table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;">
    <thead>
      <tr style="background:#f8fafc;text-align:left;">
        <th style="${reportThStyle}">Nome</th>
        <th style="${reportThStyle}width:90px;">Proporção</th>
        <th style="${reportThStyle}text-align:right;width:44px;">Qtd.</th>
        <th style="${reportThStyle}text-align:right;width:52px;">%</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          item => `
        <tr>
          <td style="${reportTdStyle}">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:9px;height:9px;border-radius:50%;background:${
                item.color
              };flex-shrink:0;"></span>
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(
                item.name
              )}</span>
            </div>
          </td>
          <td style="${reportTdStyle}">
            <div style="height:6px;border-radius:3px;background:#f1f5f9;overflow:hidden;">
              <div style="height:100%;width:${Math.max(
                item.percent,
                1
              )}%;background:${item.color};"></div>
            </div>
          </td>
          <td style="${reportTdStyle}text-align:right;font-weight:700;">${
            item.count
          }</td>
          <td style="${reportTdStyle}text-align:right;color:#6b7280;">${formatReportPercentage(
            item.percent
          )}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>
`
