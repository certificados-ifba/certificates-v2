import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiCalendar,
  FiCheck,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiX
} from 'react-icons/fi'

import { api, errorMessage } from '../../services/api'
import {
  downloadCertificate,
  downloadCertificatesZip,
  RawCertificate
} from '../../services/certificate'
import { capitalize, capitalizeFirst } from '../../services/format'
import {
  BusyButtons,
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
  Spinner,
  SubtitleCount,
  Toast,
  TopBar,
  TopBarActions,
  YearBadge,
  YearCount,
  YearHeader,
  YearLine,
  YearSection
} from '../styles'
import { Participant, UserMenu } from '../userMenu'

interface CertificateItem {
  id: string
  name: string
  type: string
  role: string
  period: string
  hours: string
  key?: string
  raw: RawCertificate
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

interface ToastState {
  kind: 'info' | 'success' | 'error'
  title: string
  description?: string
}

interface Props {
  token: string
  participant: Participant | null
  loadingParticipant: boolean
  onLogout: () => void
  onUnauthorized: () => void
}

const PER_PAGE = 100

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

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  const str = String(dateStr)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str)
    ? new Date(`${str}T12:00:00`)
    : new Date(str)
  return isNaN(date.getTime()) ? null : date
}

function formatEventDate(dateStr: string | undefined, year: string): string {
  const date = parseDate(dateStr)
  if (!date) return year
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function formatPeriod(start: string | undefined, end: string | undefined) {
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  if (!startDate) return ''
  const startLabel = startDate.toLocaleDateString('pt-BR')
  if (!endDate) return startLabel
  const endLabel = endDate.toLocaleDateString('pt-BR')
  return startLabel === endLabel ? startLabel : `${startLabel} a ${endLabel}`
}

function groupByYearAndEvent(certs: RawCertificate[]): YearGroup[] {
  const eventMap = new Map<string, EventGroup>()

  certs.forEach(cert => {
    const eventId = cert.event?.id || cert.event?.name || 'unknown'
    const year =
      cert.event?.year?.toString() ||
      String(parseDate(cert.start_date)?.getFullYear() || '')
    const type = cert.activity?.type?.name || 'Atividade'

    if (!eventMap.has(eventId)) {
      eventMap.set(eventId, {
        id: eventId,
        name: cert.event?.name || 'Evento',
        type,
        date: capitalizeFirst(formatEventDate(cert.event?.start_date, year)),
        year,
        certificates: []
      })
    }

    eventMap.get(eventId).certificates.push({
      id: cert.id,
      name: cert.activity?.name || 'Certificado',
      type,
      role: cert.function?.name ? capitalize(cert.function.name) : '',
      period: formatPeriod(cert.start_date, cert.end_date),
      hours: cert.workload ? `${cert.workload}h` : '',
      key: cert.key,
      raw: cert
    })
  })

  const yearMap = new Map<string, EventGroup[]>()
  eventMap.forEach(event => {
    if (!yearMap.has(event.year)) yearMap.set(event.year, [])
    yearMap.get(event.year).push(event)
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
  const lower = text.toLowerCase()
  return groups
    .filter(g => !year || g.year === year)
    .map(g => ({
      ...g,
      events: g.events
        .map(ev => {
          const certificates = ev.certificates.filter(
            c => !type || c.type === type
          )
          if (!lower || ev.name.toLowerCase().includes(lower)) {
            return { ...ev, certificates }
          }
          return {
            ...ev,
            certificates: certificates.filter(c =>
              c.name.toLowerCase().includes(lower)
            )
          }
        })
        .filter(ev => ev.certificates.length > 0)
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

export const Certificates: React.FC<Props> = ({
  token,
  participant,
  loadingParticipant,
  onLogout,
  onUnauthorized
}) => {
  const [certs, setCerts] = useState<RawCertificate[]>([])
  const [loadingCerts, setLoadingCerts] = useState(true)

  const [filterText, setFilterText] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterType, setFilterType] = useState('')

  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [downloadedCerts, setDownloadedCerts] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((next: ToastState, persist = false) => {
    clearTimeout(toastTimer.current)
    setToast(next)
    if (!persist) toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  useEffect(() => {
    const fetchCerts = async () => {
      const request = (page: number) =>
        api.get('me/certificates', {
          headers: { authorization: `Bearer ${token}` },
          params: {
            page,
            per_page: PER_PAGE,
            sort_by: 'start_date',
            order_by: 'DESC'
          }
        })
      try {
        setLoadingCerts(true)
        const first = await request(1)
        const totalPages = Number(first.headers['x-total-page']) || 1
        const others = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => request(i + 2))
        )
        setCerts(
          [first, ...others].flatMap(response => response.data?.data || [])
        )
      } catch (err) {
        if (err?.response?.status === 401) {
          onUnauthorized()
          return
        }
        setCerts([])
        showToast({
          kind: 'error',
          title: 'Erro ao carregar certificados',
          description: errorMessage(err, 'Tente novamente em instantes.')
        })
      } finally {
        setLoadingCerts(false)
      }
    }
    fetchCerts()
  }, [token, onUnauthorized, showToast])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenEventId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

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
      [
        ...new Set(
          yearGroups.flatMap(g =>
            g.events.flatMap(e => e.certificates.map(c => c.type))
          )
        )
      ]
        .filter(Boolean)
        .sort(),
    [yearGroups]
  )

  const allFiltered = useMemo(
    () => filteredGroups.flatMap(g => g.events.flatMap(e => e.certificates)),
    [filteredGroups]
  )
  const totalEvents = filteredGroups.reduce((a, g) => a + g.events.length, 0)

  const selectedEvent =
    filteredGroups.flatMap(g => g.events).find(e => e.id === openEventId) ??
    null

  const participantName = participant?.name || ''

  const markDownloaded = useCallback((ids: string[]) => {
    setDownloadedCerts(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
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
    async (cert: CertificateItem) => {
      if (busy) return
      setBusy(cert.id)
      showToast(
        { kind: 'info', title: 'Gerando PDF', description: cert.name },
        true
      )
      try {
        await downloadCertificate(cert.raw, participantName, token)
        markDownloaded([cert.id])
        showToast({
          kind: 'success',
          title: 'Download concluído',
          description: cert.name
        })
      } catch (err) {
        showToast({
          kind: 'error',
          title: 'Não foi possível gerar o certificado',
          description: errorMessage(err, 'Tente novamente em instantes.')
        })
      } finally {
        setBusy(null)
      }
    },
    [busy, markDownloaded, participantName, showToast, token]
  )

  const handleDownloadMany = useCallback(
    async (items: CertificateItem[], zipName: string, busyId: string) => {
      if (busy || items.length === 0) return
      setBusy(busyId)
      try {
        const { ok, failed } = await downloadCertificatesZip(
          items.map(c => c.raw),
          participantName,
          token,
          zipName,
          (done, total) =>
            showToast(
              {
                kind: 'info',
                title: 'Gerando certificados',
                description: `${done} de ${total}`
              },
              true
            )
        )
        markDownloaded(ok)
        showToast(
          failed.length === 0
            ? {
                kind: 'success',
                title: 'Download concluído',
                description: `${ok.length} certificado(s) no arquivo .zip`
              }
            : {
                kind: 'error',
                title: `${failed.length} certificado(s) não puderam ser gerados`,
                description:
                  ok.length > 0
                    ? `${ok.length} certificado(s) foram incluídos no .zip`
                    : 'Nenhum arquivo foi gerado.'
              }
        )
      } finally {
        setBusy(null)
      }
    },
    [busy, markDownloaded, participantName, showToast, token]
  )

  const handleDownloadEvent = useCallback(
    (event: EventGroup, e?: React.MouseEvent) => {
      e?.stopPropagation()
      handleDownloadMany(event.certificates, event.name, event.id)
    },
    [handleDownloadMany]
  )

  const handleDownloadAll = useCallback(() => {
    handleDownloadMany(allFiltered, 'certificados', 'all')
  }, [allFiltered, handleDownloadMany])

  const handleValidate = useCallback((cert: CertificateItem) => {
    if (cert.key)
      window.open(`${process.env.webURL}/validate/${cert.key}`, '_blank')
  }, [])

  const clearFilters = useCallback(() => {
    setFilterText('')
    setFilterYear('')
    setFilterType('')
  }, [])

  const loading = loadingParticipant || loadingCerts

  return (
    <PageWrapper>
      <ContentArea>
        <TopBar>
          <LogoWrapper>
            <img src="/logo-full.svg" alt="Certificados IFBA" />
          </LogoWrapper>
          <TopBarActions>
            {!loading && allFiltered.length > 0 && (
              <BusyButtons>
                <PrimaryButton onClick={handleDownloadAll} disabled={!!busy}>
                  <FiDownload size={14} />
                  {busy === 'all' ? 'Gerando...' : 'Baixar todos'}
                </PrimaryButton>
              </BusyButtons>
            )}
            {participant && (
              <UserMenu participant={participant} onLogout={onLogout} />
            )}
          </TopBarActions>
        </TopBar>

        {!loading && (
          <SubtitleCount>
            {allFiltered.length} certificado
            {allFiltered.length !== 1 ? 's' : ''} em {totalEvents} evento
            {totalEvents !== 1 ? 's' : ''}
          </SubtitleCount>
        )}

        {loading && (
          <LoadingWrapper>
            <Spinner />
          </LoadingWrapper>
        )}

        {!loading && (
          <>
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

            <Legend>
              <LegendDot filled />
              <span>Baixado nesta sessão</span>
              <LegendSeparator />
              <LegendDot />
              <span>Não baixado</span>
            </Legend>

            {filteredGroups.length === 0 ? (
              <EmptyState>
                <FiFileText size={40} color="#b4b2a9" />
                <p>
                  {certs.length === 0
                    ? 'Você ainda não possui certificados.'
                    : 'Nenhum certificado encontrado para os filtros aplicados.'}
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
                              <BusyButtons>
                                <SmallDownloadButton
                                  disabled={!!busy}
                                  onClick={e => handleDownloadEvent(event, e)}
                                >
                                  <FiDownload size={12} />
                                  {busy === event.id
                                    ? 'Gerando...'
                                    : 'Baixar .zip'}
                                </SmallDownloadButton>
                              </BusyButtons>
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

      {openEventId && selectedEvent && (
        <Overlay
          onClick={e => e.target === e.currentTarget && setOpenEventId(null)}
        >
          <Popup role="dialog" aria-label={selectedEvent.name}>
            <PopupHeader>
              <PopupHeaderTop>
                <div>
                  <PopupTitle>{selectedEvent.name}</PopupTitle>
                  <PopupSub>
                    {selectedEvent.type} · {selectedEvent.date}
                  </PopupSub>
                </div>
                <CloseButton
                  aria-label="Fechar"
                  onClick={() => setOpenEventId(null)}
                >
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
                        {[cert.role, cert.period, cert.hours]
                          .filter(Boolean)
                          .join(' · ')}
                      </CertInfoMeta>
                    </CertInfo>
                    <CertDownloadedCheck done={done}>
                      {done && <CheckIcon />}
                    </CertDownloadedCheck>
                    <BusyButtons>
                      {cert.key && (
                        <SmallDownloadButton
                          onClick={() => handleValidate(cert)}
                        >
                          <FiExternalLink size={12} />
                          Validar
                        </SmallDownloadButton>
                      )}
                      <SmallDownloadButton
                        disabled={!!busy}
                        onClick={() => handleDownloadCert(cert)}
                      >
                        <FiDownload size={12} />
                        {busy === cert.id ? 'Gerando...' : 'PDF'}
                      </SmallDownloadButton>
                    </BusyButtons>
                  </CertItem>
                )
              })}
            </PopupBody>

            <PopupFooter>
              <span>
                {selectedEvent.certificates.length} certificado
                {selectedEvent.certificates.length !== 1 ? 's' : ''}
              </span>
              <BusyButtons>
                <PrimaryButton
                  disabled={!!busy}
                  onClick={() => handleDownloadEvent(selectedEvent)}
                >
                  <FiDownload size={14} />
                  {busy === selectedEvent.id
                    ? 'Gerando...'
                    : 'Baixar todos do evento'}
                </PrimaryButton>
              </BusyButtons>
            </PopupFooter>
          </Popup>
        </Overlay>
      )}

      {toast && (
        <Toast kind={toast.kind} role="status">
          <strong>{toast.title}</strong>
          {toast.description}
        </Toast>
      )}
    </PageWrapper>
  )
}
