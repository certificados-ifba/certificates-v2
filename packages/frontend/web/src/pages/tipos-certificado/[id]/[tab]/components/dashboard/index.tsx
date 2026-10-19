import { Button, Select, Spinner, Table } from '@components'
import {
  IActivity,
  ICertificate,
  ITipoCertificado,
  statusTipoCertificado
} from '@dtos'
import { useToast } from '@providers'
import { generateCertificatePdf, loadAllPages } from '@services'
import {
  IReportContext,
  REPORT_GREEN,
  buildReportDonutSvg,
  buildReportFilename,
  buildReportPage,
  chunkRows,
  escapeHtml,
  formatGeneratedAt,
  reportCard,
  reportInfoRow as buildInfoRow,
  reportKpi,
  reportSectionTitle,
  reportTdStyle as tdStyle,
  reportThStyle as thStyle,
  toChartItems,
  loadReportLogoMarkup
} from '@services/reportPdf'
import { formatDate } from '@utils'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiAward,
  FiCalendar,
  FiClock,
  FiFileText,
  FiDownload
} from 'react-icons/fi'

import {
  AnalysisChart,
  AnalysisLayout,
  AnalysisTable,
  CardLabel,
  CardValue,
  CardWrapper,
  CardsGrid,
  ChartLabel,
  ChartShell,
  DashboardCard,
  DashboardActions,
  DashboardHeading,
  DashboardName,
  DashboardSubtitle,
  DashboardTopBar,
  DashboardWrapper,
  FilterRow,
  MetricIcon,
  PanelDescription,
  PanelHeader,
  PanelTitle,
  SummaryHeader,
  SummaryValue,
  PeriodValue,
  TableContainer,
  TotalRow,
  ActivityTitle,
  ActivitySubtitle,
  LoadingContainer,
  ColorBadge,
  TableCellWithBadge
} from './styles'

interface Props {
  event: ITipoCertificado
}

interface IActivityResponse {
  data: IActivity[]
}

interface ICertificateDashboard
  extends Omit<ICertificate, 'participant' | 'activity' | 'function'> {
  participant?: {
    id?: string
    name?: string
  }
  activity?: {
    id?: string
    name?: string
  }
  function?: {
    id?: string
    name?: string
  }
}

interface IGroupRow {
  key: string
  name: string
  count: number
  percent: number
}

interface IChartItem extends IGroupRow {
  color: string
  start: number
}

type FilterMode = 'activity' | 'function'

const CHART_COLORS = [
  '#3DAA3D',
  '#4C83E3',
  '#7A3FE0',
  '#F59D28',
  '#F4C21E',
  '#BDBFC7',
  '#73767D',
  '#14B8A6'
]

const CHART_RADIUS = 120
const CHART_CENTER = 160
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS

const DAY_MS = 24 * 60 * 60 * 1000

const formatPercentage = (value: number) =>
  `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`

const formatWorkload = (value: number) => {
  if (!value && value !== 0) return '-'

  const totalMinutes = Math.round(Number(value) * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0 && minutes === 0) return '0h'
  if (minutes === 0) return `${hours}h`
  if (hours === 0) return `${minutes}m`

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

const NO_GROUP_KEY = '__none__'

const getGroupKey = (item: ICertificateDashboard, mode: FilterMode) => {
  if (mode === 'function')
    return item.function?.id || item.function?.name || NO_GROUP_KEY

  return item.activity?.id || item.activity?.name || NO_GROUP_KEY
}

const getGroupName = (item: ICertificateDashboard, mode: FilterMode) => {
  if (mode === 'function') return item.function?.name || 'Sem função'

  return item.activity?.name || 'Sem atividade'
}

/**
 * Conta certificados por grupo (atividade ou função). Certificado sem
 * atividade/função entra em "Sem atividade"/"Sem função", para o total
 * bater com o card "Certificados emitidos".
 */
const createInitialChartRows = (
  certificates: ICertificateDashboard[],
  mode: FilterMode
) => {
  const buckets = new Map<string, { name: string; total: number }>()

  certificates.forEach(certificate => {
    const key = getGroupKey(certificate, mode)
    const current = buckets.get(key) || {
      name: getGroupName(certificate, mode),
      total: 0
    }

    current.total += 1
    buckets.set(key, current)
  })

  const rows = Array.from(buckets.entries()).map(([key, value]) => ({
    key,
    name: value.name,
    count: value.total
  }))

  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return rows
    .map(row => ({
      ...row,
      percent: total > 0 ? (row.count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))
}

const ACTIVITY_ROWS_PER_PAGE = 12
const MAX_ANALYSIS_ROWS = 8

interface IReportActivityRow {
  activity: string
  start_date: string
  end_date: string
  workload: number
  certificates: number
}

const buildOverviewPageHtml = (
  ctx: IReportContext,
  event: ITipoCertificado,
  certificatesTotal: number,
  activitiesTotal: number,
  totalWorkload: number,
  eventDuration: string,
  durationDays: number,
  topActivity: IGroupRow | undefined,
  topFunction: IGroupRow | undefined
) => {
  const averagePerActivity = activitiesTotal
    ? (certificatesTotal / activitiesTotal).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })
    : '0,0'

  const body = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${reportKpi(
        'Certificados emitidos',
        certificatesTotal.toLocaleString('pt-BR'),
        'Total gerado no evento',
        '#7E3FF2'
      )}
      ${reportKpi(
        'Atividades',
        activitiesTotal.toLocaleString('pt-BR'),
        'Cadastradas no evento',
        '#2F80ED'
      )}
      ${reportKpi(
        'Carga horária',
        escapeHtml(formatWorkload(totalWorkload)),
        'Soma das atividades',
        '#F2994A'
      )}
      ${reportKpi(
        'Duração',
        `${durationDays} dia${durationDays === 1 ? '' : 's'}`,
        escapeHtml(eventDuration),
        '#F2B01E'
      )}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      ${reportCard(`
        ${reportSectionTitle('Dados do evento')}
        ${buildInfoRow('Nome', escapeHtml(event?.name || '-'))}
        ${buildInfoRow('Coordenador', escapeHtml(event?.user?.name || '-'))}
        ${buildInfoRow('Período', escapeHtml(eventDuration))}
        ${buildInfoRow(
          'Status',
          escapeHtml(
            statusTipoCertificado[event?.status]?.text || event?.status || '-'
          )
        )}
      `)}
      ${reportCard(`
        ${reportSectionTitle('Destaques')}
        ${buildInfoRow(
          'Média de certificados por atividade',
          averagePerActivity
        )}
        ${buildInfoRow(
          'Atividade com mais certificados',
          topActivity
            ? `${escapeHtml(topActivity.name)} (${topActivity.count})`
            : '-'
        )}
        ${buildInfoRow(
          'Função mais frequente',
          topFunction
            ? `${escapeHtml(topFunction.name)} (${topFunction.count})`
            : '-'
        )}
        <div style="margin-top:12px;padding:10px 12px;background:#f0fdf4;border-radius:8px;font-size:11px;color:#166534;line-height:1.5;">
          Os números refletem os dados cadastrados no momento da exportação.
        </div>
      `)}
    </div>
  `

  return buildReportPage(ctx, 1, 'Resumo executivo', body)
}

/** Keeps the largest groups and folds the rest into "Outros" so the page never overflows. */
const limitChartRows = (rows: IGroupRow[]): IGroupRow[] => {
  if (rows.length <= MAX_ANALYSIS_ROWS) return rows
  const head = rows.slice(0, MAX_ANALYSIS_ROWS - 1)
  const tail = rows.slice(MAX_ANALYSIS_ROWS - 1)
  return [
    ...head,
    {
      key: '__others__',
      name: `Outros (${tail.length})`,
      count: tail.reduce((sum, row) => sum + row.count, 0),
      percent: tail.reduce((sum, row) => sum + row.percent, 0)
    }
  ]
}

const buildDistributionPanel = (title: string, rows: IGroupRow[]) => {
  const items = toChartItems(limitChartRows(rows), CHART_COLORS)
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  const tableRows = items
    .map(
      item => `
        <tr>
          <td style="${tdStyle}">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:9px;height:9px;border-radius:50%;background:${
                item.color
              };flex-shrink:0;"></span>
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;">${escapeHtml(
                item.name
              )}</span>
            </div>
          </td>
          <td style="${tdStyle}width:90px;">
            <div style="height:6px;border-radius:3px;background:#f1f5f9;overflow:hidden;">
              <div style="height:100%;width:${Math.max(
                item.percent,
                1
              )}%;background:${item.color};"></div>
            </div>
          </td>
          <td style="${tdStyle}text-align:right;font-weight:700;">${
        item.count
      }</td>
          <td style="${tdStyle}text-align:right;color:#6b7280;">${formatPercentage(
        item.percent
      )}</td>
        </tr>
      `
    )
    .join('')

  return reportCard(
    `
      ${reportSectionTitle(
        title,
        `${total.toLocaleString('pt-BR')} certificados considerados`
      )}
      ${
        items.length
          ? `
        <div style="display:flex;justify-content:center;margin-bottom:10px;">
          <div style="width:170px;height:170px;">${buildReportDonutSvg(
            items,
            'certificados',
            total
          )}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;">
          <thead>
            <tr style="background:#f8fafc;text-align:left;">
              <th style="${thStyle}">Nome</th>
              <th style="${thStyle}width:90px;">Proporção</th>
              <th style="${thStyle}text-align:right;width:44px;">Qtd.</th>
              <th style="${thStyle}text-align:right;width:52px;">%</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`
          : '<div style="font-size:12px;color:#6b7280;padding:24px 0;text-align:center;">Sem dados para exibir.</div>'
      }
    `,
    'height:100%;'
  )
}

const buildAnalysisPageHtml = (
  ctx: IReportContext,
  pageNumber: number,
  activityRows: IGroupRow[],
  functionRows: IGroupRow[]
) => {
  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;height:100%;padding-bottom:14px;box-sizing:border-box;">
      ${buildDistributionPanel('Certificados por atividade', activityRows)}
      ${buildDistributionPanel('Certificados por função', functionRows)}
    </div>
  `

  return buildReportPage(ctx, pageNumber, 'Análise de distribuição', body)
}

const buildActivitiesPageHtml = (
  ctx: IReportContext,
  pageNumber: number,
  chunk: IReportActivityRow[],
  allRows: IReportActivityRow[],
  chunkIndex: number,
  chunkCount: number
) => {
  const totalCertificates = allRows.reduce(
    (sum, row) => sum + row.certificates,
    0
  )
  const totalWorkload = allRows.reduce((sum, row) => sum + row.workload, 0)
  const isLast = chunkIndex === chunkCount - 1
  const offset = chunkIndex * ACTIVITY_ROWS_PER_PAGE

  const rows = chunk
    .map((row, index) => {
      const share = totalCertificates
        ? (row.certificates / totalCertificates) * 100
        : 0
      return `
        <tr style="background:${index % 2 ? '#fcfcfd' : '#fff'};">
          <td style="${tdStyle}color:#9ca3af;width:28px;">${
        offset + index + 1
      }</td>
          <td style="${tdStyle}font-weight:600;color:#111827;">${escapeHtml(
        row.activity
      )}</td>
          <td style="${tdStyle}">${escapeHtml(formatDate(row.start_date))}</td>
          <td style="${tdStyle}">${escapeHtml(formatDate(row.end_date))}</td>
          <td style="${tdStyle}text-align:right;">${escapeHtml(
        formatWorkload(row.workload)
      )}</td>
          <td style="${tdStyle}text-align:right;font-weight:700;">${
        row.certificates
      }</td>
          <td style="${tdStyle}text-align:right;color:#6b7280;">${formatPercentage(
        share
      )}</td>
        </tr>
      `
    })
    .join('')

  const totalRow = isLast
    ? `
      <tr style="background:#f0fdf4;font-weight:700;color:#166534;">
        <td style="padding:9px 10px;border-top:2px solid ${REPORT_GREEN};" colspan="4">Total (${
        allRows.length
      } atividades)</td>
        <td style="padding:9px 10px;border-top:2px solid ${REPORT_GREEN};text-align:right;">${escapeHtml(
        formatWorkload(totalWorkload)
      )}</td>
        <td style="padding:9px 10px;border-top:2px solid ${REPORT_GREEN};text-align:right;">${totalCertificates}</td>
        <td style="padding:9px 10px;border-top:2px solid ${REPORT_GREEN};text-align:right;">100%</td>
      </tr>`
    : ''

  const body = reportCard(`
    ${reportSectionTitle(
      'Atividades do evento',
      chunkCount > 1
        ? `Parte ${chunkIndex + 1} de ${chunkCount} · ${
            allRows.length
          } atividades no total`
        : `${allRows.length} atividades cadastradas`
    )}
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f8fafc;text-align:left;">
          <th style="${thStyle}">#</th>
          <th style="${thStyle}">Atividade</th>
          <th style="${thStyle}">Início</th>
          <th style="${thStyle}">Término</th>
          <th style="${thStyle}text-align:right;">Carga horária</th>
          <th style="${thStyle}text-align:right;">Certificados</th>
          <th style="${thStyle}text-align:right;">% do total</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows ||
          `<tr><td colspan="7" style="padding:16px 10px;color:#6b7280;text-align:center;">Sem atividades cadastradas.</td></tr>`
        }
        ${totalRow}
      </tbody>
    </table>
  `)

  return buildReportPage(ctx, pageNumber, 'Detalhamento das atividades', body)
}

export const EventDashboard: React.FC<Props> = ({ event }) => {
  const { addToast } = useToast()
  const { push } = useRouter()

  const goToTab = useCallback(
    (tab: string) => {
      if (event?.id) push(`/tipos-certificado/${event.id}/${tab}`)
    },
    [event?.id, push]
  )

  const handleCardKey = useCallback(
    (e: React.KeyboardEvent, tab: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        goToTab(tab)
      }
    },
    [goToTab]
  )
  const [filterMode, setFilterMode] = useState<FilterMode>('activity')
  const [certificates, setCertificates] = useState<ICertificateDashboard[]>([])
  const [activities, setActivities] = useState<IActivity[]>([])
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      if (!event?.id) return

      try {
        setIsLoadingSummary(true)

        const [certificateList, activityList] = await Promise.all([
          loadAllPages<ICertificateDashboard>(
            `events/${event.id}/certificates`,
            {
              sort_by: 'created_at',
              order_by: 'ASC'
            }
          ),
          loadAllPages<IActivity>(`events/${event.id}/activities`, {
            sort_by: 'start_date',
            order_by: 'ASC'
          })
        ])

        if (!active) return

        setCertificates(certificateList)
        setActivities(activityList)
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao carregar dashboard',
          description: error
        })
      } finally {
        if (active) setIsLoadingSummary(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [addToast, event?.id])

  const analysisRows = useMemo(
    () => createInitialChartRows(certificates, filterMode),
    [certificates, filterMode]
  )

  const chartItems = useMemo(
    () =>
      toChartItems(analysisRows, CHART_COLORS).map((item, index) => ({
        ...item,
        key: analysisRows[index]?.key || item.name
      })),
    [analysisRows]
  )

  const analysisTotal = useMemo(
    () => analysisRows.reduce((sum, row) => sum + row.count, 0),
    [analysisRows]
  )

  const certificatesTotal = certificates.length

  const totalWorkload = useMemo(
    () =>
      activities.reduce(
        (sum, activity) => sum + Number(activity.workload || 0),
        0
      ),
    [activities]
  )

  const eventDuration = useMemo(() => {
    if (!event?.start_date || !event?.end_date) return '-'

    const start = new Date(event.start_date)
    const end = new Date(event.end_date)

    return `${formatDate(start)} - ${formatDate(end)}`
  }, [event?.end_date, event?.start_date])

  const durationDays = useMemo(() => {
    if (!event?.start_date || !event?.end_date) return 0

    const start = new Date(event.start_date)
    const end = new Date(event.end_date)
    const diffDays = Math.round((end.getTime() - start.getTime()) / DAY_MS)

    return Math.max(1, diffDays + 1)
  }, [event?.end_date, event?.start_date])

  const certificateCountsByActivity = useMemo(() => {
    const map = new Map<string, number>()

    certificates.forEach(certificate => {
      const key = certificate.activity?.id || certificate.activity?.name
      if (!key) return
      map.set(key, (map.get(key) || 0) + 1)
    })

    return map
  }, [certificates])

  const activityRows = useMemo(() => {
    return activities.map(activity => ({
      id: activity.id,
      activity: activity.name,
      start_date: activity.start_date,
      end_date: activity.end_date,
      workload: Number(activity.workload || 0),
      certificates:
        certificateCountsByActivity.get(activity.id || activity.name) || 0
    }))
  }, [activities, certificateCountsByActivity])

  const selectedFilterLabel =
    filterMode === 'activity'
      ? 'Certificados por atividade'
      : 'Certificados por função'

  const filterOptions = useMemo(
    () => [
      { label: 'Certificados por atividade', value: 'activity' },
      { label: 'Certificados por função', value: 'function' }
    ],
    []
  )

  const handleExportPdf = useCallback(async () => {
    if (!event?.id || isExporting) return

    try {
      setIsExporting(true)

      const activityDistribution = createInitialChartRows(
        certificates,
        'activity'
      )
      const functionDistribution = createInitialChartRows(
        certificates,
        'function'
      )
      const activityChunks = chunkRows(activityRows, ACTIVITY_ROWS_PER_PAGE)
      const logoMarkup = await loadReportLogoMarkup().catch(() => '')

      const ctx: IReportContext = {
        title: event.name || 'Evento',
        reportLabel: 'Relatório do evento',
        generatedAt: formatGeneratedAt(),
        totalPages: 2 + activityChunks.length,
        logoMarkup
      }

      const pagesHtml = [
        buildOverviewPageHtml(
          ctx,
          event,
          certificatesTotal,
          activities.length,
          totalWorkload,
          eventDuration,
          durationDays,
          activityDistribution[0],
          functionDistribution[0]
        ),
        buildAnalysisPageHtml(
          ctx,
          2,
          activityDistribution,
          functionDistribution
        ),
        ...activityChunks.map((chunk, index) =>
          buildActivitiesPageHtml(
            ctx,
            3 + index,
            chunk,
            activityRows,
            index,
            activityChunks.length
          )
        )
      ]

      await generateCertificatePdf({
        filename: buildReportFilename(
          'relatorio_dashboard',
          event.name || String(event.id)
        ),
        pages: pagesHtml.map(contentHtml => ({
          contentHtml,
          layout: { mode: 'report' as const }
        }))
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao exportar relatório',
        description: error
      })
    } finally {
      setIsExporting(false)
    }
  }, [
    activities.length,
    activityRows,
    addToast,
    certificates,
    certificatesTotal,
    durationDays,
    event,
    eventDuration,
    isExporting,
    totalWorkload
  ])

  return (
    <DashboardWrapper>
      <DashboardTopBar>
        <DashboardHeading>
          <DashboardName>Dashboard</DashboardName>
          <DashboardSubtitle>
            Resumo geral do evento com análise de participantes e atividades.
          </DashboardSubtitle>
        </DashboardHeading>
        <DashboardActions>
          <Button
            color="secondary"
            outline
            onClick={handleExportPdf}
            loading={isExporting}
            disabled={isLoadingSummary || isExporting}
            type="button"
          >
            <FiDownload size={18} />
            <span>Exportar PDF</span>
          </Button>
        </DashboardActions>
      </DashboardTopBar>

      <CardsGrid>
        <DashboardCard
          $clickable
          role="button"
          tabIndex={0}
          title="Ver certificados"
          onClick={() => goToTab('certificates')}
          onKeyDown={e => handleCardKey(e, 'certificates')}
        >
          <CardWrapper>
            <MetricIcon color="#7E3FF2">
              <FiAward size={28} />
            </MetricIcon>
            <div>
              <CardLabel>Certificados emitidos</CardLabel>
              <CardValue>{certificatesTotal.toLocaleString('pt-BR')}</CardValue>
              <SummaryValue>Total de certificados gerados</SummaryValue>
            </div>
          </CardWrapper>
        </DashboardCard>

        <DashboardCard
          $clickable
          role="button"
          tabIndex={0}
          title="Ver atividades"
          onClick={() => goToTab('activities')}
          onKeyDown={e => handleCardKey(e, 'activities')}
        >
          <CardWrapper>
            <MetricIcon color="#2F80ED">
              <FiFileText size={28} />
            </MetricIcon>
            <div>
              <CardLabel>Atividades</CardLabel>
              <CardValue>{activities.length.toLocaleString('pt-BR')}</CardValue>
              <SummaryValue>Atividades cadastradas</SummaryValue>
            </div>
          </CardWrapper>
        </DashboardCard>

        <DashboardCard
          $clickable
          role="button"
          tabIndex={0}
          title="Ver atividades"
          onClick={() => goToTab('activities')}
          onKeyDown={e => handleCardKey(e, 'activities')}
        >
          <CardWrapper>
            <MetricIcon color="#F2994A">
              <FiClock size={28} />
            </MetricIcon>
            <div>
              <CardLabel>Carga horária total</CardLabel>
              <CardValue>{formatWorkload(totalWorkload)}</CardValue>
              <SummaryValue>Soma de todas as atividades</SummaryValue>
            </div>
          </CardWrapper>
        </DashboardCard>

        <DashboardCard
          $clickable
          role="button"
          tabIndex={0}
          title="Ver informações do evento"
          onClick={() => goToTab('info')}
          onKeyDown={e => handleCardKey(e, 'info')}
        >
          <CardWrapper>
            <MetricIcon color="#F2B01E">
              <FiCalendar size={28} />
            </MetricIcon>
            <div>
              <CardLabel>Período do evento</CardLabel>
              <PeriodValue>{eventDuration}</PeriodValue>
              <SummaryValue>
                {durationDays
                  ? `${durationDays} dia${
                      durationDays === 1 ? '' : 's'
                    } de duração`
                  : '-'}
              </SummaryValue>
            </div>
          </CardWrapper>
        </DashboardCard>
      </CardsGrid>

      {isLoadingSummary ? (
        <LoadingContainer>
          <Spinner size={40} />
        </LoadingContainer>
      ) : (
        <>
          <DashboardCard>
            <PanelHeader>
              <div>
                <PanelTitle>Análise de certificados</PanelTitle>
                <PanelDescription>
                  Visualize a distribuição dos certificados emitidos de acordo
                  com o filtro selecionado.
                </PanelDescription>
              </div>
              <FilterRow>
                <span>Filtrar por</span>
                <Select
                  instanceId="dashboard-participants-filter"
                  menuPosition="fixed"
                  isSearchable={false}
                  options={filterOptions}
                  value={filterOptions.find(
                    option => option.value === filterMode
                  )}
                  handleOnSelect={option => {
                    if (option?.value) setFilterMode(option.value)
                  }}
                />
              </FilterRow>
            </PanelHeader>

            <AnalysisLayout>
              <ChartShell>
                <AnalysisChart
                  viewBox="0 0 320 320"
                  aria-label={selectedFilterLabel}
                >
                  <circle
                    cx={CHART_CENTER}
                    cy={CHART_CENTER}
                    r={CHART_RADIUS}
                    fill="none"
                    stroke="#ECECF2"
                    strokeWidth={40}
                  />
                  {chartItems.map(item => {
                    const dashLength =
                      CHART_CIRCUMFERENCE * (item.percent / 100)
                    const labelAngle =
                      ((item.start + item.percent / 2) / 100) * 360 - 90
                    const labelRadius = 118
                    const labelX =
                      CHART_CENTER +
                      Math.cos((labelAngle * Math.PI) / 180) * labelRadius
                    const labelY =
                      CHART_CENTER +
                      Math.sin((labelAngle * Math.PI) / 180) * labelRadius

                    return (
                      <g key={item.key}>
                        <circle
                          cx={CHART_CENTER}
                          cy={CHART_CENTER}
                          r={CHART_RADIUS}
                          fill="none"
                          stroke={item.color}
                          strokeWidth={40}
                          strokeDasharray={`${dashLength} ${
                            CHART_CIRCUMFERENCE - dashLength
                          }`}
                          strokeDashoffset={
                            -CHART_CIRCUMFERENCE * (item.start / 100)
                          }
                          transform={`rotate(-90 ${CHART_CENTER} ${CHART_CENTER})`}
                          strokeLinecap="butt"
                        />
                        {item.percent >= 4 && (
                          <ChartLabel x={labelX} y={labelY}>
                            {formatPercentage(item.percent)}
                          </ChartLabel>
                        )}
                      </g>
                    )
                  })}
                  <circle
                    cx={CHART_CENTER}
                    cy={CHART_CENTER}
                    r={68}
                    fill="#FFFFFF"
                  />
                </AnalysisChart>
              </ChartShell>

              <AnalysisTable>
                <TableContainer>
                  <Table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Quantidade</th>
                        <th>Percentual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartItems.map(row => (
                        <tr key={row.key}>
                          <td>
                            <TableCellWithBadge>
                              <ColorBadge color={row.color} />
                              <span>{row.name}</span>
                            </TableCellWithBadge>
                          </td>
                          <td>{row.count.toLocaleString('pt-BR')}</td>
                          <td>{formatPercentage(row.percent)}</td>
                        </tr>
                      ))}
                      <TotalRow>
                        <td>Total</td>
                        <td>{analysisTotal.toLocaleString('pt-BR')}</td>
                        <td>100%</td>
                      </TotalRow>
                    </tbody>
                  </Table>
                </TableContainer>
              </AnalysisTable>
            </AnalysisLayout>
          </DashboardCard>

          <DashboardCard>
            <SummaryHeader>
              <div>
                <ActivityTitle>Atividades do evento</ActivityTitle>
                <ActivitySubtitle>
                  Lista completa das atividades cadastradas para este evento.
                </ActivitySubtitle>
              </div>
            </SummaryHeader>

            <Table>
              <thead>
                <tr>
                  <th>Atividade</th>
                  <th>Início</th>
                  <th>Término</th>
                  <th>Carga horária</th>
                  <th>Certificados emitidos</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: '#A0AEC0'
                      }}
                    >
                      Nenhuma atividade cadastrada para este evento.
                    </td>
                  </tr>
                ) : (
                  activityRows.map(activity => (
                    <tr key={activity.id}>
                      <td>{activity.activity}</td>
                      <td>{formatDate(activity.start_date)}</td>
                      <td>{formatDate(activity.end_date)}</td>
                      <td>{formatWorkload(activity.workload)}</td>
                      <td>{activity.certificates.toLocaleString('pt-BR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </DashboardCard>
        </>
      )}
    </DashboardWrapper>
  )
}
