import { Loading } from '@components'
import { LogoFull } from '@assets'
import { useToast } from '@providers'
import { api } from '@services'
import { capitalize } from '@utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiCalendar,
  FiCheck,
  FiDownload,
  FiFileText,
  FiX
} from 'react-icons/fi'

import {
  CertCount,
  CertDownloadedCheck,
  CertIcon,
  CertInfo,
  CertInfoMeta,
  CertInfoName,
  CertItem,
  CloseButton,
  ContentArea,
  DownloadedIndicator,
  EmptyState,
  EventCard,
  EventCardFooter,
  EventCardMeta,
  EventCardTop,
  EventName,
  EventTypeBadge,
  EventsGrid,
  FilterBar,
  FilterInput,
  FilterLabel,
  FilterSelect,
  Legend,
  LegendDot,
  LegendSeparator,
  LoadingWrapper,
  LogoWrapper,
  OutlineButton,
  Overlay,
  PageWrapper,
  Popup,
  PopupBody,
  PopupFooter,
  PopupHeader,
  PopupHeaderTop,
  PopupSub,
  PopupTitle,
  PrimaryButton,
  SmallDownloadButton,
  SubtitleCount,
  TopBar,
  TopBarActions,
  YearBadge,
  YearCount,
  YearHeader,
  YearLine,
  YearSection
} from '../../styles'
import { UserMenu } from '../userMenu'

/* ── Types ───────────────────────────────────────────── */

interface Participant {
  name: string
  email: string
  cpf: string
  phone: string
  dob: string
  institution: string
}

interface CertificateItem {
  id: string
  name: string
  issued: string
  hours: string
  key?: string
}

interface EventGroup {
  id: string
  name: string
  type: string
  date: string
  year: string
  certificates: CertificateItem[]
}

interface YearGroup {
  year: string
  events: EventGroup[]
}

interface Props {
  token: string | null
  participant: Participant | null
  loadingParticipant: boolean
  onLogout: () => void
}

/* ── Helpers ─────────────────────────────────────────── */

function getBadgeStyle(type: string): { background: string; color: string } {
  const t = (type || '').toLowerCase()
  if (t.includes('conferên') || t.includes('palestra')) {
    return { background: '#EEEDFE', color: '#3C3489' }
  }
  if (t.includes('workshop') || t.includes('oficina')) {
    return { background: '#E1F5EE', color: '#085041' }
  }
  if (t.includes('curso') || t.includes('formação') || t.includes('formacao')) {
    return { background: '#FAEEDA', color: '#633806' }
  }
  if (t.includes('mesa') || t.includes('debate') || t.includes('simpósio')) {
    return { background: '#FCE8F3', color: '#701A4E' }
  }
  return { background: '#F0F0EE', color: '#4A4A48' }
}

function formatEventDate(dateStr: string | undefined, year: string): string {
  if (!dateStr) return year
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return year
  }
}

function groupByYearAndEvent(certs: any[]): YearGroup[] {
  const eventMap = new Map<string, EventGroup>()

  certs.forEach(cert => {
    const eventId = cert.event?._id || cert.event?.name || 'unknown'
    const year =
      cert.event?.year?.toString() ||
      new Date(cert.created_at).getFullYear().toString()

    if (!eventMap.has(eventId)) {
      const date = formatEventDate(cert.event?.start_date, year)
      eventMap.set(eventId, {
        id: eventId,
        name: cert.event?.name || 'Evento',
        type: cert.activity?.type?.name || cert.function?.name || 'Atividade',
        date: capitalize(date),
        year,
        certificates: []
      })
    }

    const group = eventMap.get(eventId)!
    group.certificates.push({
      id: cert._id,
      name: cert.activity?.name || 'Certificado',
      issued: new Date(cert.created_at).toLocaleDateString('pt-BR'),
      hours: cert.workload || '—',
      key: cert.key
    })
  })

  const yearMap = new Map<string, EventGroup[]>()
  eventMap.forEach(event => {
    if (!yearMap.has(event.year)) yearMap.set(event.year, [])
    yearMap.get(event.year)!.push(event)
  })

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .map(([year, events]) => ({ year, events }))
}

function applyFilters(
  groups: YearGroup[],
  text: string,
  year: string,
  type: string
): YearGroup[] {
  return groups
    .filter(g => !year || g.year === year)
    .map(g => ({
      ...g,
      events: g.events.filter(ev => {
        if (type && ev.type !== type) return false
        if (text) {
          const lower = text.toLowerCase()
          return (
            ev.name.toLowerCase().includes(lower) ||
            ev.certificates.some(c => c.name.toLowerCase().includes(lower))
          )
        }
        return true
      })
    }))
    .filter(g => g.events.length > 0)
}

const CheckIcon = () => (
  <svg
    viewBox="0 0 10 10"
    fill="none"
    stroke="#fff"
    strokeWidth="1.8"
    width="10"
    height="10"
  >
    <polyline points="1.5,5 4,7.5 8.5,2.5" />
  </svg>
)

/* ── Component ───────────────────────────────────────── */

export const Certificates: React.FC<Props> = ({
  token,
  participant,
  loadingParticipant,
  onLogout
}) => {
  const { addToast } = useToast()

  const [certs, setCerts] = useState<any[]>([])
  const [loadingCerts, setLoadingCerts] = useState(true)

  const [filterText, setFilterText] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterType, setFilterType] = useState('')

  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [downloadedCerts, setDownloadedCerts] = useState<Set<string>>(
    new Set()
  )

  /* fetch */
  useEffect(() => {
    if (!token) return
    const fetchCerts = async () => {
      try {
        setLoadingCerts(true)
        const { data } = await api.get('me/certificates', {
          headers: { authorization: `Bearer ${token}` },
          params: { perPage: 500, page: 1 }
        })
        setCerts(data?.data || [])
      } catch {
        setCerts([])
      } finally {
        setLoadingCerts(false)
      }
    }
    fetchCerts()
  }, [token])

  /* close popup on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenEventId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  /* derived data */
  const yearGroups = useMemo(() => groupByYearAndEvent(certs), [certs])

  const filteredGroups = useMemo(
    () => applyFilters(yearGroups, filterText, filterYear, filterType),
    [yearGroups, filterText, filterYear, filterType]
  )

  const availableYears = useMemo(
    () =>
      [...new Set(yearGroups.map(g => g.year))].sort(
        (a, b) => parseInt(b) - parseInt(a)
      ),
    [yearGroups]
  )

  const availableTypes = useMemo(
    () =>
      [...new Set(yearGroups.flatMap(g => g.events.map(e => e.type)))].filter(
        Boolean
      ),
    [yearGroups]
  )

  const totalCerts = filteredGroups.reduce(
    (a, g) => a + g.events.reduce((b, e) => b + e.certificates.length, 0),
    0
  )
  const totalEvents = filteredGroups.reduce((a, g) => a + g.events.length, 0)

  const selectedEvent =
    filteredGroups.flatMap(g => g.events).find(e => e.id === openEventId) ??
    null

  /* download helpers */
  const markCertDownloaded = useCallback((certId: string) => {
    setDownloadedCerts(prev => new Set(prev).add(certId))
  }, [])

  const markEventCertsDownloaded = useCallback((event: EventGroup) => {
    setDownloadedCerts(prev => {
      const next = new Set(prev)
      event.certificates.forEach(c => next.add(c.id))
      return next
    })
  }, [])

  const isEventDownloaded = useCallback(
    (event: EventGroup) =>
      event.certificates.length > 0 &&
      event.certificates.every(c => downloadedCerts.has(c.id)),
    [downloadedCerts]
  )

  const handleDownloadCert = useCallback(
    (cert: CertificateItem) => {
      addToast({
        type: 'info',
        title: 'Download iniciado',
        description: cert.name
      })
      if (cert.key) {
        window.open(`/validate/${cert.key}`, '_blank')
      }
      setTimeout(() => markCertDownloaded(cert.id), 400)
    },
    [addToast, markCertDownloaded]
  )

  const handleDownloadEvent = useCallback(
    (event: EventGroup, e?: React.MouseEvent) => {
      e?.stopPropagation()
      addToast({
        type: 'info',
        title: event.name,
        description: `${event.certificates.length} certificado(s) sendo baixado(s)`
      })
      setTimeout(() => markEventCertsDownloaded(event), 400)
    },
    [addToast, markEventCertsDownloaded]
  )

  const handleDownloadAll = useCallback(() => {
    addToast({
      type: 'info',
      title: 'Download iniciado',
      description: `${totalCerts} certificado(s)`
    })
    setTimeout(() => {
      filteredGroups.forEach(g =>
        g.events.forEach(e => markEventCertsDownloaded(e))
      )
    }, 400)
  }, [addToast, totalCerts, filteredGroups, markEventCertsDownloaded])

  const clearFilters = useCallback(() => {
    setFilterText('')
    setFilterYear('')
    setFilterType('')
  }, [])

  const loading = loadingParticipant || loadingCerts

  /* ── Render ────────────────────────────────────────── */

  return (
    <PageWrapper>
      <ContentArea>
        {/* Top Bar */}
        <TopBar>
          <LogoWrapper>
            <LogoFull />
          </LogoWrapper>
          <TopBarActions>
            {!loading && (
              <PrimaryButton onClick={handleDownloadAll}>
                <FiDownload size={14} />
                Baixar todos
              </PrimaryButton>
            )}
            {participant && (
              <UserMenu participant={participant} onLogout={onLogout} />
            )}
          </TopBarActions>
        </TopBar>

        {/* Subtitle */}
        {!loading && (
          <SubtitleCount>
            {totalCerts} certificado{totalCerts !== 1 ? 's' : ''} em{' '}
            {totalEvents} evento{totalEvents !== 1 ? 's' : ''}
          </SubtitleCount>
        )}

        {/* Loading */}
        {loading && (
          <LoadingWrapper>
            <Loading active />
          </LoadingWrapper>
        )}

        {!loading && (
          <>
            {/* Filter Bar */}
            <FilterBar>
              <FilterLabel>Filtrar:</FilterLabel>
              <FilterInput
                type="text"
                placeholder="Nome do evento ou certificado..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
              />
              <FilterSelect
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
              >
                <option value="">Todos os anos</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                {availableTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </FilterSelect>
              <OutlineButton onClick={clearFilters}>Limpar</OutlineButton>
            </FilterBar>

            {/* Legend */}
            <Legend>
              <LegendDot filled />
              <span>Já baixado</span>
              <LegendSeparator />
              <LegendDot />
              <span>Não baixado</span>
            </Legend>

            {/* Content */}
            {filteredGroups.length === 0 ? (
              <EmptyState>
                <FiFileText size={40} color="#b4b2a9" />
                <p>
                  Nenhum certificado encontrado para os filtros aplicados.
                </p>
              </EmptyState>
            ) : (
              filteredGroups.map(yearGroup => {
                const certsTotal = yearGroup.events.reduce(
                  (a, e) => a + e.certificates.length,
                  0
                )
                return (
                  <YearSection key={yearGroup.year}>
                    <YearHeader>
                      <YearBadge>{yearGroup.year}</YearBadge>
                      <YearLine />
                      <YearCount>
                        {yearGroup.events.length} evento
                        {yearGroup.events.length !== 1 ? 's' : ''} ·{' '}
                        {certsTotal} certificado
                        {certsTotal !== 1 ? 's' : ''}
                      </YearCount>
                    </YearHeader>

                    <EventsGrid>
                      {yearGroup.events.map(event => {
                        const downloaded = isEventDownloaded(event)
                        const badge = getBadgeStyle(event.type)
                        return (
                          <EventCard
                            key={event.id}
                            downloaded={downloaded}
                            onClick={() => setOpenEventId(event.id)}
                          >
                            <DownloadedIndicator done={downloaded}>
                              {downloaded && <CheckIcon />}
                            </DownloadedIndicator>

                            <EventCardTop>
                              <EventName>{event.name}</EventName>
                              <EventTypeBadge style={badge}>
                                {event.type}
                              </EventTypeBadge>
                            </EventCardTop>

                            <EventCardMeta>
                              <FiCalendar size={12} />
                              {event.date}
                            </EventCardMeta>

                            <EventCardFooter>
                              <CertCount>
                                <strong>{event.certificates.length}</strong>{' '}
                                certificado
                                {event.certificates.length !== 1 ? 's' : ''}
                              </CertCount>
                              <SmallDownloadButton
                                onClick={e => handleDownloadEvent(event, e)}
                              >
                                <FiDownload size={12} />
                                Baixar .zip
                              </SmallDownloadButton>
                            </EventCardFooter>
                          </EventCard>
                        )
                      })}
                    </EventsGrid>
                  </YearSection>
                )
              })
            )}
          </>
        )}
      </ContentArea>

      {/* Popup */}
      {openEventId && selectedEvent && (
        <Overlay
          onClick={e =>
            e.target === e.currentTarget && setOpenEventId(null)
          }
        >
          <Popup>
            <PopupHeader>
              <PopupHeaderTop>
                <div>
                  <PopupTitle>{selectedEvent.name}</PopupTitle>
                  <PopupSub>
                    {selectedEvent.type} · {selectedEvent.date}
                  </PopupSub>
                </div>
                <CloseButton onClick={() => setOpenEventId(null)}>
                  <FiX size={14} />
                </CloseButton>
              </PopupHeaderTop>
            </PopupHeader>

            <PopupBody>
              {selectedEvent.certificates.map(cert => {
                const done = downloadedCerts.has(cert.id)
                return (
                  <CertItem key={cert.id}>
                    <CertIcon>
                      <FiCheck size={18} color="#379936" />
                    </CertIcon>
                    <CertInfo>
                      <CertInfoName>{cert.name}</CertInfoName>
                      <CertInfoMeta>
                        Emitido em {cert.issued}
                        {cert.hours && cert.hours !== '—'
                          ? ` · ${cert.hours}`
                          : ''}
                      </CertInfoMeta>
                    </CertInfo>
                    <CertDownloadedCheck done={done}>
                      {done && <CheckIcon />}
                    </CertDownloadedCheck>
                    <SmallDownloadButton
                      onClick={() => handleDownloadCert(cert)}
                    >
                      <FiDownload size={12} />
                      PDF
                    </SmallDownloadButton>
                  </CertItem>
                )
              })}
            </PopupBody>

            <PopupFooter>
              <span>
                {selectedEvent.certificates.length} certificado
                {selectedEvent.certificates.length !== 1 ? 's' : ''}
              </span>
              <PrimaryButton
                onClick={() => handleDownloadEvent(selectedEvent)}
              >
                <FiDownload size={14} />
                Baixar todos do evento
              </PrimaryButton>
            </PopupFooter>
          </Popup>
        </Overlay>
      )}
    </PageWrapper>
  )
}
