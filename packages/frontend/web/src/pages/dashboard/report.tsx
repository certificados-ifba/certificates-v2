import { ITipoCertificado, statusTipoCertificado } from '@dtos'
import {
  IReportContext,
  REPORT_GREEN,
  buildDistributionTable,
  buildReportDonutSvg,
  buildReportPage,
  chunkRows,
  escapeHtml,
  formatGeneratedAt,
  reportCard,
  reportInfoRow,
  reportKpi,
  reportSectionTitle,
  reportTdStyle,
  reportThStyle,
  toChartItems
} from '@services/reportPdf'
import { formatDate } from '@utils'

export const GENERAL_REPORT_FILENAME_PREFIX = 'relatorio_dashboard_geral'

const EVENT_ROWS_PER_PAGE = 13

/** Same mapping used by the on-screen donut (Tag color -> hex). */
const STATUS_COLOR_HEX: Record<string, string> = {
  secondary: '#3DAA3D',
  success: '#3DAA3D',
  info: '#4C83E3',
  warning: '#F59D28',
  danger: '#E53E3E',
  medium: '#A0AEC0',
  primary: '#7A3FE0'
}

const FALLBACK_PALETTE = [
  '#3DAA3D',
  '#4C83E3',
  '#7A3FE0',
  '#F59D28',
  '#E53E3E',
  '#A0AEC0'
]

interface IGeneralMetrics {
  totalEvents: number
  totalParticipants: number
  totalCertificates: number
  certificationRate: number
}

interface IBuildGeneralReportOptions {
  metrics: IGeneralMetrics
  /** Events already filtered by the status selected on screen. */
  events: ITipoCertificado[]
  statusFilterLabel: string
  certCountByEvent: Record<string, number>
  logoMarkup?: string
}

const statusText = (status: string) =>
  statusTipoCertificado[status]?.text || status || '-'

const statusBadge = (status: string) => {
  const color =
    STATUS_COLOR_HEX[statusTipoCertificado[status]?.color] || '#A0AEC0'
  return `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${color}1f;color:${color};">${escapeHtml(
    statusText(status)
  )}</span>`
}

const buildOverviewPage = (
  ctx: IReportContext,
  {
    metrics,
    events,
    statusFilterLabel,
    certCountByEvent
  }: IBuildGeneralReportOptions
) => {
  const statusMap: Record<string, number> = {}
  events.forEach(evt => {
    if (evt?.status) statusMap[evt.status] = (statusMap[evt.status] || 0) + 1
  })
  const total = events.length
  const chartItems = toChartItems(
    Object.entries(statusMap)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        name: statusText(status),
        count,
        percent: total ? (count / total) * 100 : 0,
        color: STATUS_COLOR_HEX[statusTipoCertificado[status]?.color]
      })),
    FALLBACK_PALETTE
  )

  const topEvent = [...events].sort(
    (a, b) => (certCountByEvent[b?.id] || 0) - (certCountByEvent[a?.id] || 0)
  )[0]
  const publishedCount = statusMap.PUBLISHED || 0
  const avgPerEvent = metrics.totalEvents
    ? (metrics.totalCertificates / metrics.totalEvents).toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }
      )
    : '0,0'

  const body = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${reportKpi(
        'Total de eventos',
        metrics.totalEvents.toLocaleString('pt-BR'),
        'Cadastrados no sistema',
        '#2F80ED'
      )}
      ${reportKpi(
        'Participantes',
        metrics.totalParticipants.toLocaleString('pt-BR'),
        'Participantes totais',
        '#36A420'
      )}
      ${reportKpi(
        'Certificados emitidos',
        metrics.totalCertificates.toLocaleString('pt-BR'),
        'Em todos os eventos',
        '#7E3FF2'
      )}
      ${reportKpi(
        'Taxa de certificação',
        `${metrics.certificationRate}%`,
        'Certificados / participantes',
        '#F2994A'
      )}
    </div>

    <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:14px;">
      ${reportCard(`
        ${reportSectionTitle(
          'Distribuição de eventos por status',
          `Filtro aplicado: ${statusFilterLabel}`
        )}
        ${
          chartItems.length
            ? `<div style="display:flex;gap:18px;align-items:center;">
                <div style="width:180px;height:180px;flex-shrink:0;">${buildReportDonutSvg(
                  chartItems,
                  'eventos',
                  total
                )}</div>
                <div style="flex:1;min-width:0;">${buildDistributionTable(
                  chartItems
                )}</div>
              </div>`
            : '<div style="font-size:12px;color:#6b7280;padding:24px 0;text-align:center;">Nenhum evento registrado.</div>'
        }
      `)}
      ${reportCard(`
        ${reportSectionTitle('Destaques')}
        ${reportInfoRow('Eventos publicados', `${publishedCount} de ${total}`)}
        ${reportInfoRow('Média de certificados por evento', avgPerEvent)}
        ${reportInfoRow(
          'Evento com mais certificados',
          topEvent && certCountByEvent[topEvent.id]
            ? `${escapeHtml(topEvent.name)} (${certCountByEvent[topEvent.id]})`
            : '-'
        )}
        <div style="margin-top:12px;padding:10px 12px;background:#f0fdf4;border-radius:8px;font-size:11px;color:#166534;line-height:1.5;">
          Os números refletem os dados cadastrados no momento da exportação.
        </div>
      `)}
    </div>
  `

  return buildReportPage(ctx, 1, 'Resumo geral', body)
}

const buildEventsPage = (
  ctx: IReportContext,
  pageNumber: number,
  chunk: ITipoCertificado[],
  allEvents: ITipoCertificado[],
  chunkIndex: number,
  chunkCount: number,
  { certCountByEvent, statusFilterLabel }: IBuildGeneralReportOptions
) => {
  const offset = chunkIndex * EVENT_ROWS_PER_PAGE
  const isLast = chunkIndex === chunkCount - 1
  const totalCertificates = allEvents.reduce(
    (sum, evt) => sum + (certCountByEvent[evt?.id] || 0),
    0
  )

  const rows = chunk
    .map(
      (evt, index) => `
        <tr style="background:${index % 2 ? '#fcfcfd' : '#fff'};">
          <td style="${reportTdStyle}color:#9ca3af;width:28px;">${
        offset + index + 1
      }</td>
          <td style="${reportTdStyle}font-weight:600;color:#111827;">${escapeHtml(
        evt?.name || '-'
      )}</td>
          <td style="${reportTdStyle}">${statusBadge(evt?.status)}</td>
          <td style="${reportTdStyle}">${escapeHtml(
        evt?.user?.name || '-'
      )}</td>
          <td style="${reportTdStyle}">${
        evt?.start_date ? formatDate(evt.start_date) : '-'
      }</td>
          <td style="${reportTdStyle}">${
        evt?.end_date ? formatDate(evt.end_date) : '-'
      }</td>
          <td style="${reportTdStyle}text-align:right;font-weight:700;">${
        certCountByEvent[evt?.id] || 0
      }</td>
        </tr>`
    )
    .join('')

  const totalRow = isLast
    ? `<tr style="background:#f0fdf4;font-weight:700;color:#166534;">
        <td style="padding:9px 10px;border-top:2px solid ${REPORT_GREEN};" colspan="6">Total (${allEvents.length} eventos)</td>
        <td style="padding:9px 10px;border-top:2px solid ${REPORT_GREEN};text-align:right;">${totalCertificates}</td>
      </tr>`
    : ''

  const body = reportCard(`
    ${reportSectionTitle(
      'Eventos',
      `${chunkCount > 1 ? `Parte ${chunkIndex + 1} de ${chunkCount} · ` : ''}${
        allEvents.length
      } eventos · Filtro: ${statusFilterLabel}`
    )}
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f8fafc;text-align:left;">
          <th style="${reportThStyle}">#</th>
          <th style="${reportThStyle}">Evento</th>
          <th style="${reportThStyle}">Status</th>
          <th style="${reportThStyle}">Coordenador</th>
          <th style="${reportThStyle}">Início</th>
          <th style="${reportThStyle}">Término</th>
          <th style="${reportThStyle}text-align:right;">Certificados</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows ||
          '<tr><td colspan="7" style="padding:16px 10px;color:#6b7280;text-align:center;">Nenhum evento encontrado.</td></tr>'
        }
        ${totalRow}
      </tbody>
    </table>
  `)

  return buildReportPage(ctx, pageNumber, 'Listagem de eventos', body)
}

/** Returns one HTML string per PDF page. */
export const buildGeneralReportPages = (
  options: IBuildGeneralReportOptions
): string[] => {
  const sortedEvents = [...options.events].sort(
    (a, b) =>
      new Date(b?.start_date || 0).getTime() -
      new Date(a?.start_date || 0).getTime()
  )
  const chunks = chunkRows(sortedEvents, EVENT_ROWS_PER_PAGE)

  const ctx: IReportContext = {
    title: 'Dashboard Geral',
    reportLabel: 'Relatório consolidado do sistema',
    generatedAt: formatGeneratedAt(),
    totalPages: 1 + chunks.length,
    logoMarkup: options.logoMarkup
  }

  return [
    buildOverviewPage(ctx, options),
    ...chunks.map((chunk, index) =>
      buildEventsPage(
        ctx,
        2 + index,
        chunk,
        sortedEvents,
        index,
        chunks.length,
        options
      )
    )
  ]
}
