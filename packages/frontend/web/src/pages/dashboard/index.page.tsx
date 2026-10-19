import {
  Card,
  CardIcon,
  Container,
  Grid,
  Header,
  PaginatedTable,
  Button,
  Tag,
  Select
} from '@components'
import { ITipoCertificado, statusTipoCertificado } from '@dtos'
import { withAuth } from '@hocs'
import { useToast } from '@providers'
import {
  api,
  generateCertificatePdf,
  loadAllPages,
  usePaginatedRequest
} from '@services'
import { buildReportFilename, loadReportLogoMarkup } from '@services/reportPdf'
import { formatDate } from '@utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  FiAward,
  FiDownload,
  FiCalendar,
  FiUsers,
  FiBarChart2,
  FiInfo,
  FiFilter,
  FiArrowRight,
  FiSliders,
  FiCheckCircle
} from 'react-icons/fi'

import {
  buildGeneralReportPages,
  GENERAL_REPORT_FILENAME_PREFIX
} from './report'

interface ISystemMetrics {
  totalEvents: number
  /** Eventos publicados (vem do /resume, que conta só PUBLISHED). */
  publishedEvents: number
  totalParticipants: number
  /** Certificados de eventos publicados (vem do /resume). */
  totalCertificates: number
  certificationRate: number
}

const statusOptions = [
  { label: 'Todos os Status', value: 'ALL' },
  { label: 'Publicado', value: 'PUBLISHED' },
  { label: 'Rascunho', value: 'DRAFT' },
  { label: 'Em revisão', value: 'REVIEW' }
]

const Dashboard: React.FC = () => {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const [metrics, setMetrics] = useState<ISystemMetrics>({
    totalEvents: 0,
    publishedEvents: 0,
    totalParticipants: 0,
    totalCertificates: 0,
    certificationRate: 0
  })
  const [eventsList, setEventsList] = useState<ITipoCertificado[]>([])
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
  const [certCountByEvent, setCertCountByEvent] = useState<
    Record<string, number>
  >({})
  const [isExporting, setIsExporting] = useState(false)
  const { addToast } = useToast()

  const request = usePaginatedRequest<any>({
    url: 'tipos-certificado',
    params: {
      sort_by: 'end_date',
      order_by: 'DESC',
      per_page: 5,
      ...(selectedStatus !== 'ALL' ? { status: selectedStatus } : {})
    }
  })

  useEffect(() => {
    let isSubscribed = true

    const fetchGeneralMetrics = async () => {
      try {
        setIsLoadingMetrics(true)
        const [resumeRes, allEvents] = await Promise.all([
          api
            .get<{
              data: {
                events: number
                participants: number
                certificates: number
              }
            }>('resume')
            .catch(() => null),
          loadAllPages<ITipoCertificado>('tipos-certificado', {
            sort_by: 'created_at',
            order_by: 'DESC'
          }).catch(() => [] as ITipoCertificado[])
        ])

        if (!isSubscribed) return

        const resumeData = resumeRes?.data?.data
        setEventsList(allEvents)

        // O /resume conta só os eventos publicados; o total vem da listagem.
        const totalEvents = allEvents.length
        const publishedEvents = resumeData?.events || 0
        const totalParticipants = resumeData?.participants || 0
        const totalCertificates = resumeData?.certificates || 0
        const certificationRate =
          totalParticipants > 0
            ? Math.min(
                100,
                Math.round((totalCertificates / totalParticipants) * 100)
              )
            : 0

        setMetrics({
          totalEvents,
          publishedEvents,
          totalParticipants,
          totalCertificates,
          certificationRate
        })
      } catch (err) {
        console.error('Erro ao buscar métricas gerais do sistema', err)
      } finally {
        if (isSubscribed) setIsLoadingMetrics(false)
      }
    }

    fetchGeneralMetrics()

    return () => {
      isSubscribed = false
    }
  }, [])

  const consolidatedEvents = useMemo(() => {
    if (eventsList.length > 0) return eventsList
    if (request.data?.data && request.data.data.length > 0)
      return request.data.data
    return []
  }, [eventsList, request.data?.data])

  const filteredEvents = useMemo(() => {
    if (selectedStatus === 'ALL') return consolidatedEvents
    return consolidatedEvents.filter(
      (evt: ITipoCertificado) => evt?.status === selectedStatus
    )
  }, [consolidatedEvents, selectedStatus])

  const statusDistribution = useMemo(() => {
    if (filteredEvents.length === 0) return []
    const statusMap: Record<string, number> = {}
    filteredEvents.forEach((evt: ITipoCertificado) => {
      if (evt?.status) {
        statusMap[evt.status] = (statusMap[evt.status] || 0) + 1
      }
    })
    return Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      color: statusTipoCertificado[status]?.color || 'medium',
      text: statusTipoCertificado[status]?.text || status
    }))
  }, [filteredEvents])

  const totalDistributionEvents = useMemo(() => {
    return statusDistribution.reduce((sum, item) => sum + item.count, 0)
  }, [statusDistribution])

  const fetchCertCounts = useCallback(
    async (eventsToExport: ITipoCertificado[]) => {
      const counts: Record<string, number> = {}
      await Promise.all(
        eventsToExport.map(async evt => {
          const eventId = evt.id
          if (!eventId) return
          // `page` é obrigatório: sem ele a API responde 500.
          try {
            const res = await api.get(`events/${eventId}/certificates`, {
              params: { page: 1, per_page: 1 }
            })
            counts[eventId] = Number(res.headers?.['x-total-count'] || 0)
          } catch {
            try {
              const res = await api.get(
                `tipos-certificado/${eventId}/certificates`,
                {
                  params: { page: 1, per_page: 1 }
                }
              )
              counts[eventId] = Number(res.headers?.['x-total-count'] || 0)
            } catch {
              // Sem contagem: não guarda no cache, para tentar de novo
              // na próxima exportação (o relatório mostra 0).
            }
          }
        })
      )
      return counts
    },
    []
  )

  const handleExportPdf = useCallback(async () => {
    if (isExporting) return

    try {
      setIsExporting(true)
      // Busca só os eventos que ainda não têm contagem no cache: a troca de
      // filtro depois da 1ª exportação traz eventos que não estavam nele.
      const missingEvents = filteredEvents.filter(
        evt => evt?.id && certCountByEvent[evt.id] === undefined
      )
      const [logoMarkup, fetchedCounts] = await Promise.all([
        loadReportLogoMarkup().catch(() => ''),
        missingEvents.length > 0
          ? fetchCertCounts(missingEvents)
          : Promise.resolve({} as Record<string, number>)
      ])
      const counts = { ...certCountByEvent, ...fetchedCounts }
      setCertCountByEvent(counts)

      const pages = buildGeneralReportPages({
        metrics,
        events: filteredEvents,
        statusFilterLabel:
          statusOptions.find(opt => opt.value === selectedStatus)?.label ||
          'Todos os Status',
        certCountByEvent: counts,
        logoMarkup
      })

      await generateCertificatePdf({
        filename: buildReportFilename(GENERAL_REPORT_FILENAME_PREFIX),
        pages: pages.map(contentHtml => ({
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
    addToast,
    certCountByEvent,
    fetchCertCounts,
    filteredEvents,
    isExporting,
    metrics,
    selectedStatus
  ])

  return (
    <Container>
      <Head>
        <title>Dashboard Geral | Certificados</title>
      </Head>
      <Header
        title="Dashboard Geral"
        subtitle="Métricas e análises consolidadas de todo o sistema."
        icon={FiBarChart2}
        controls={
          <nav>
            <Button
              id="general-dashboard-export-pdf"
              onClick={handleExportPdf}
              disabled={isExporting || isLoadingMetrics}
            >
              <FiDownload size={20} />
              <span className="hide-md-down">
                {isExporting ? 'Gerando...' : 'Exportar PDF'}
              </span>
            </Button>
          </nav>
        }
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          margin: '16px 0 8px'
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#4A5568',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FiFilter size={16} />
          Filtrar Eventos Recentes:
        </span>
        <div style={{ minWidth: '200px' }}>
          <Select
            instanceId="dashboard-status-filter"
            isSearchable={false}
            options={statusOptions}
            value={statusOptions.find(opt => opt.value === selectedStatus)}
            handleOnSelect={option => {
              if (option?.value) {
                request.resetPage()
                setSelectedStatus(option.value)
              }
            }}
          />
        </div>
      </div>

      <div style={{ margin: '16px 0 24px' }}>
        <Grid cols={4}>
          <div>
            <CardIcon
              title="Total de Eventos"
              value={isLoadingMetrics ? '...' : metrics.totalEvents + ''}
              icon={<FiCalendar size={24} />}
              color="secondary"
              buttonName="Ver Todos"
              buttonIcon={<FiArrowRight size={18} />}
              onButtonClick={() => {
                router.push('/tipos-certificado')
              }}
            />
          </div>
          <div>
            <CardIcon
              title="Participantes Totais"
              value={isLoadingMetrics ? '...' : metrics.totalParticipants + ''}
              icon={<FiUsers size={24} />}
              color="secondary"
              buttonName="Gerenciar"
              buttonIcon={<FiUsers size={18} />}
              onButtonClick={() => {
                router.push('/participants')
              }}
            />
          </div>
          <div>
            <CardIcon
              title="Certificados Emitidos"
              value={isLoadingMetrics ? '...' : metrics.totalCertificates + ''}
              icon={<FiAward size={24} />}
              color="info"
              buttonName="Configurar"
              buttonIcon={<FiSliders size={18} />}
              onButtonClick={() => {
                router.push('/tipos-certificado')
              }}
            />
          </div>
          <div>
            <CardIcon
              title="Taxa de Certificação"
              value={isLoadingMetrics ? '...' : metrics.certificationRate + '%'}
              icon={<FiAward size={24} />}
              color="primary"
              buttonName="Eventos"
              buttonIcon={<FiCheckCircle size={18} />}
              onButtonClick={() => {
                router.push('/tipos-certificado')
              }}
            />
          </div>
        </Grid>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        <Card>
          <header
            style={{
              paddingBottom: '12px',
              borderBottom: '1px solid #EDF2F7',
              marginBottom: '16px'
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                margin: 0,
                color: '#2D3748'
              }}
            >
              Distribuição de Eventos por Status
            </h2>
          </header>
          {statusDistribution.length === 0 ? (
            <div
              style={{ padding: '24px', textAlign: 'center', color: '#A0AEC0' }}
            >
              Nenhum evento registrado.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                padding: '12px 8px'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '220px',
                  height: '220px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke="#E6E8F0"
                    strokeWidth="24"
                  ></circle>
                  {(() => {
                    const radius = 70
                    const center = 100
                    const circumference = 2 * Math.PI * radius
                    let accumulatedPercent = 0

                    const colorMap: Record<string, string> = {
                      secondary: '#3DAA3D',
                      success: '#3DAA3D',
                      info: '#4C83E3',
                      warning: '#F59D28',
                      danger: '#E53E3E',
                      medium: '#A0AEC0',
                      primary: '#7A3FE0'
                    }

                    const chartItems = statusDistribution.map(item => {
                      const percent =
                        totalDistributionEvents > 0
                          ? (item.count / totalDistributionEvents) * 100
                          : 0
                      const start = accumulatedPercent
                      accumulatedPercent += percent

                      const dashLength = circumference * (percent / 100)
                      const labelAngle =
                        ((start + percent / 2) / 100) * 360 - 90
                      const labelX =
                        center + Math.cos((labelAngle * Math.PI) / 180) * radius
                      const labelY =
                        center + Math.sin((labelAngle * Math.PI) / 180) * radius

                      return {
                        item,
                        percent,
                        start,
                        dashLength,
                        dashOffset: -circumference * (start / 100),
                        labelX,
                        labelY,
                        strokeColor: colorMap[item.color] || '#7A3FE0'
                      }
                    })

                    return (
                      <>
                        <g id="arcs-layer">
                          {chartItems.map((item, idx) => (
                            <circle
                              key={idx}
                              cx={center}
                              cy={center}
                              r={radius}
                              fill="none"
                              stroke={item.strokeColor}
                              strokeWidth="24"
                              strokeDasharray={`${item.dashLength} ${
                                circumference - item.dashLength
                              }`}
                              strokeDashoffset={item.dashOffset}
                              transform={`rotate(-90 ${center} ${center})`}
                            />
                          ))}
                        </g>
                        <g id="labels-layer">
                          {chartItems.map((item, idx) =>
                            item.percent > 5 ? (
                              <text
                                key={idx}
                                x={item.labelX}
                                y={item.labelY}
                                fill="#FFFFFF"
                                fontSize="12"
                                fontWeight="700"
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  pointerEvents: 'none',
                                  paintOrder: 'stroke fill',
                                  stroke: 'rgba(0,0,0,0.25)',
                                  strokeWidth: '2px'
                                }}
                              >
                                {Math.round(item.percent)}%
                              </text>
                            ) : null
                          )}
                        </g>
                      </>
                    )
                  })()}
                  <text
                    x="100"
                    y="93"
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="700"
                    fill="#2D3748"
                  >
                    {totalDistributionEvents}
                  </text>
                  <text
                    x="100"
                    y="112"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="500"
                    fill="#718096"
                  >
                    Eventos
                  </text>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem'
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid #E6E8F0',
                        textAlign: 'left',
                        color: '#718096'
                      }}
                    >
                      <th style={{ padding: '8px 0', fontWeight: 600 }}>
                        Status
                      </th>
                      <th
                        style={{
                          padding: '8px 0',
                          textAlign: 'right',
                          fontWeight: 600
                        }}
                      >
                        Eventos
                      </th>
                      <th
                        style={{
                          padding: '8px 0',
                          textAlign: 'right',
                          fontWeight: 600
                        }}
                      >
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusDistribution.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: '1px solid #F7F8FA' }}
                      >
                        <td
                          style={{
                            padding: '8px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Tag size="sm" color={item.color as any}>
                            {item.text}
                          </Tag>
                        </td>
                        <td
                          style={{
                            padding: '8px 0',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: '#2D3748'
                          }}
                        >
                          {item.count}
                        </td>
                        <td
                          style={{
                            padding: '8px 0',
                            textAlign: 'right',
                            color: '#718096'
                          }}
                        >
                          {totalDistributionEvents > 0
                            ? Math.round(
                                (item.count / totalDistributionEvents) * 100
                              )
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <header
            style={{
              paddingBottom: '12px',
              borderBottom: '1px solid #EDF2F7',
              marginBottom: '16px'
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                margin: 0,
                color: '#2D3748'
              }}
            >
              Eventos Recentes
            </h2>
          </header>
          <PaginatedTable request={request}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const list = request.data?.data || []

                if (list.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          textAlign: 'center',
                          padding: '16px',
                          color: '#A0AEC0'
                        }}
                      >
                        Nenhum evento encontrado com o status selecionado.
                      </td>
                    </tr>
                  )
                }

                return list.map((event: ITipoCertificado) => (
                  <tr
                    key={event?.id}
                    onClick={() => {
                      router.push(`/tipos-certificado/${event?.id}/info`)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600, color: '#2D3748' }}>
                      {event.name}
                    </td>
                    <td>
                      <Tag
                        size="sm"
                        color={
                          statusTipoCertificado[event.status]?.color as any
                        }
                      >
                        {statusTipoCertificado[event.status]?.text}
                      </Tag>
                    </td>
                    <td style={{ color: '#718096' }}>
                      {formatDate(event.start_date)}
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </PaginatedTable>
        </Card>
      </div>
    </Container>
  )
}

export default withAuth(Dashboard)
