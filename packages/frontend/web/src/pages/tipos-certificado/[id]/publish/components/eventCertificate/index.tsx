import {
  Button,
  Grid,
  Table
} from '@components'
import { api } from '@services'
import { generateCertificatePdf } from '@services/pdf'
import { getModelRows, IModelRow, isDownloadedForModel } from '@utils'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiAward, FiCheckCircle, FiDownload, FiSearch, FiUser, FiX } from 'react-icons/fi'

import { CardContainer, Container, Header } from './styles'

interface IGenericRef {
  id: string
  name: string
}

interface ICriterion {
  activity?: IGenericRef
  // Formato antigo (tipo de atividade + função)
  function?: IGenericRef
  type_activity?: IGenericRef
}

interface IApiModel {
  id: string
  name: string
  pages: Array<{
    type: string
    image: string
    text: string
    layout: any
  }>
  criterions: ICriterion[]
  is_default: boolean
  created_at: string
  updated_at: string
}

interface IProcessedCertificate {
  id: string
  name: string
  criterions: ICriterion[]
  is_default: boolean
  updatedAt: string
  front?: {
    img: string
    text: string
    layout?: any
  }
  verse?: {
    img: string
    text: string
    layout?: any
  }
  pages: IApiModel['pages']
}

interface Props {
  event?: any
}

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:4001'

const formatDateRange = (start: string, end: string): string => {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })} a ${e.toLocaleDateString('pt-BR', opts)}`
  }
  return `${s.toLocaleDateString('pt-BR', opts)} a ${e.toLocaleDateString('pt-BR', opts)}`
}

const apiModelToCertificate = (model: IApiModel): IProcessedCertificate => {
  const frontPage = model.pages.find(p => p.type === 'frente')
  const versePage = model.pages.find(p => p.type === 'verso')

  return {
    id: model.id,
    name: model.name,
    criterions: model.criterions || [],
    is_default: !!model.is_default,
    updatedAt: model.updated_at,
    pages: model.pages,
    front: frontPage
      ? { img: frontPage.image ? `${STORAGE_URL}/upload/${frontPage.image}` : '', text: frontPage.text, layout: frontPage.layout }
      : { img: '', text: '', layout: null },
    verse: versePage
      ? { img: versePage.image ? `${STORAGE_URL}/upload/${versePage.image}` : '', text: versePage.text, layout: versePage.layout }
      : undefined
  }
}

interface IParticipant {
  id: string
  certificateId: string
  name: string
  activityName: string
  activityTypeName: string
  functionName: string
  workload?: number
  start_date?: string
  end_date?: string
  authorship_order?: string
  additional_field?: string
  key?: string
}

const substituteCertificateText = (
  html: string,
  event: any,
  participant: IParticipant,
  generationData: { tipoAtividade: string; funcao: string }
): string => {
  if (!html) return ''
  return html
    .replace(/\[participante_nome\]/g, participant.name || '')
    .replace(/\[evento_nome\]/g, event?.name || '')
    .replace(/\[evento_sigla\]/g, event?.initials || '')
    .replace(/\[evento_edicao\]/g, event?.edition || '')
    .replace(
      /\[participacao_periodo\]/g,
      participant.start_date && participant.end_date
        ? formatDateRange(participant.start_date, participant.end_date)
        : ''
    )
    .replace(/\[participacao_carga_horaria\]/g, `${participant.workload || ''} horas`)
    .replace(/\[participacao_ordem_autoria\]/g, participant.authorship_order || '')
    .replace(/\[participacao_texto_adicional\]/g, participant.additional_field || '')
    .replace(/\[tipo_atividade\]/g, generationData.tipoAtividade)
    .replace(/\[tipo_funcao\]/g, generationData.funcao)
    .replace(/\[criterioVisualizado\]/g, generationData.funcao)
}

export const EventCertificate: React.FC<Props> = ({ event }) => {
  const [certificateList, setCertificateList] = useState<IProcessedCertificate[]>([])
  const [allCertificates, setAllCertificates] = useState<any[]>([])
  const [activities, setActivities] = useState<IGenericRef[]>([])
  const [loadingModels, setLoadingModels] = useState(true)

  // Seleção de participante
  const [openParticipantModal, setOpenParticipantModal] = useState(false)
  const [participantList, setParticipantList] = useState<IParticipant[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [participantSearch, setParticipantSearch] = useState('')
  const [downloadingParticipantId, setDownloadingParticipantId] = useState<string | null>(null)

  const [certificateSelected, setCertificateSelected] = useState<IProcessedCertificate | null>(null)
  const [activitySelected, setActivitySelected] = useState<string>('')

  useEffect(() => {
    const loadModels = async () => {
      if (!event?.id) return
      try {
        setLoadingModels(true)
        const [modelsRes, certsRes, activitiesRes] = await Promise.all([
          api.get(`tipos-certificado/${event.id}/models`),
          api.get(`tipos-certificado/${event.id}/certificates`, { params: { take: 100, skip: 0 } }),
          api.get(`tipos-certificado/${event.id}/activities`, { params: { sort_by: 'name', order_by: 'ASC' } })
        ])
        const models: IApiModel[] = modelsRes?.data?.data || []
        setAllCertificates(certsRes?.data?.data || [])
        setActivities(activitiesRes?.data?.data || [])
        setCertificateList(models.map(apiModelToCertificate))
      } catch (err) {
        console.error('Erro ao carregar modelos:', err)
      } finally {
        setLoadingModels(false)
      }
    }
    if (event) loadModels()
  }, [event])

  // Linhas de cada modelo (uma por critério ou, no padrão, por atividade sem modelo)
  const rowsByModel = useMemo(
    () =>
      new Map(
        certificateList.map(model => [
          model.id,
          getModelRows(model, certificateList, activities, allCertificates)
        ])
      ),
    [certificateList, activities, allCertificates]
  )

  const handleOpenParticipantModal = useCallback(async (certificate: IProcessedCertificate, row: IModelRow) => {
    setCertificateSelected(certificate)
    setActivitySelected(row.label)
    setParticipantSearch('')
    setOpenParticipantModal(true)
    if (!event?.id) return
    try {
      setLoadingParticipants(true)
      const res = await api.get(`tipos-certificado/${event.id}/certificates`, { params: { take: 100, skip: 0 } })
      const certs: any[] = res?.data?.data || []
      if (certs.length >= 100) {
        console.warn('[EventCertificate] Limite de 100 certificados atingido. Podem existir mais registros não exibidos.')
      }

      // Recalcula a linha com os certificados recém-buscados
      const matchingCerts =
        getModelRows(certificate, certificateList, activities, certs)
          .find(freshRow => freshRow.key === row.key)?.certificates || []

      const seen = new Set<string>()
      const participants: IParticipant[] = []
      for (const c of matchingCerts) {
        if (!c?.participant?.id || seen.has(c.participant.id)) continue
        seen.add(c.participant.id)
        participants.push({
          id: c.participant.id,
          certificateId: c.id,
          name: c.participant.name,
          activityName: c.activity?.name || '',
          activityTypeName: c.activity?.type?.name || '',
          functionName: c.function?.name || '',
          workload: c.workload,
          start_date: c.start_date,
          end_date: c.end_date,
          authorship_order: c.authorship_order,
          additional_field: c.additional_field,
          key: c.key
        })
      }

      setParticipantList(participants)
    } catch (err) {
      console.error('Erro ao carregar participantes:', err)
      setParticipantList([])
    } finally {
      setLoadingParticipants(false)
    }
  }, [event, certificateList, activities])

  const handleCloseParticipantModal = useCallback(() => {
    setOpenParticipantModal(false)
    setCertificateSelected(null)
    setActivitySelected('')
  }, [])

  const handleSelectParticipant = useCallback(async (participant: IParticipant) => {
    if (!certificateSelected || !event) return
    setDownloadingParticipantId(participant.id)
    try {
      const generationData = {
        tipoAtividade: participant.activityTypeName,
        funcao: participant.functionName
      }

      const pages = (certificateSelected.pages || []).map(page => ({
        backgroundImageUrl: page.image ? `${STORAGE_URL}/upload/${page.image}` : undefined,
        contentHtml: substituteCertificateText(page.text, event, participant, generationData),
        validationCode: participant.key,
        layout: page.layout
      }))

      await generateCertificatePdf({
        filename: `certificado_${participant.key || participant.certificateId}`,
        pages
      })

      // Só marca como baixado o que o servidor confirmou (com a data dele)
      try {
        const response = await api.patch(
          `tipos-certificado/${event.id}/certificates/${participant.certificateId}/download`,
          { model_id: certificateSelected.id }
        )
        const downloads = response?.data?.data?.certificate?.downloads
        if (downloads) {
          setAllCertificates(list =>
            list.map(c => (c.id === participant.certificateId ? { ...c, downloads } : c))
          )
        }
      } catch (markErr) {
        console.error('Erro ao marcar certificado como baixado:', markErr)
      }
      setOpenParticipantModal(false)
    } catch (err) {
      console.error('Erro ao gerar certificado:', err)
    } finally {
      setDownloadingParticipantId(null)
    }
  }, [certificateSelected, event])

  const filteredParticipants = participantList.filter(p => {
    const q = participantSearch.toLowerCase()
    const combinationText = `${p.activityName} ${p.functionName}`
    return (
      p.name.toLowerCase().includes(q) ||
      combinationText.toLowerCase().includes(q)
    )
  })

  return (
    <Container>
      <Grid cols={3}>
        {certificateList.map((certificate) => {
          const rows = rowsByModel.get(certificate.id) || []

          return (
            <CardContainer key={certificate.id}>
              <Header>
                <div className="icon">
                  <FiAward size={20} />
                </div>
                <h2>{certificate.name}</h2>
                <span
                  style={{
                    marginLeft: 10,
                    marginTop: 'auto',
                    marginBottom: 'auto',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    color: certificate.is_default ? '#a86b00' : '#1a5fb4',
                    backgroundColor: certificate.is_default ? '#fff3cd' : '#e3edfb'
                  }}
                >
                  {certificate.is_default ? 'Modelo Padrão' : 'Modelo com Critério'}
                </span>
              </Header>
              <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, minHeight: '200px', overflow: 'hidden' }}>
                {certificate.front?.img ? (
                  <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                    <Image
                      src={certificate.front.img}
                      alt={`${certificate.name} - frente`}
                      width={300}
                      height={200}
                      unoptimized
                      style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '200px' }}
                    />
                    {certificate.verse?.img && (
                      <figcaption style={{ fontSize: '0.7rem', color: '#718096' }}>Frente</figcaption>
                    )}
                  </figure>
                ) : (
                  <p style={{ color: '#999' }}>Sem imagem</p>
                )}
                {certificate.verse?.img && (
                  <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                    <Image
                      src={certificate.verse.img}
                      alt={`${certificate.name} - verso`}
                      width={300}
                      height={200}
                      unoptimized
                      style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '200px' }}
                    />
                    <figcaption style={{ fontSize: '0.7rem', color: '#718096' }}>Verso</figcaption>
                  </figure>
                )}
              </main>
              <div style={{ padding: '0 15px 15px' }}>
                {rows.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <th>Nº</th>
                        <th>Atividade</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => {
                        const isCriterionDownloaded = row.certificates
                          .some(c => isDownloadedForModel(c, certificate.id, certificate.updatedAt))

                        return (
                          <tr key={row.key}>
                            <td>{index + 1}</td>
                            <td>{row.label}</td>
                            <td>
                              <span
                                title={isCriterionDownloaded ? 'Certificado já baixado' : 'Certificado ainda não baixado'}
                                style={{ display: 'inline-flex' }}
                              >
                                {isCriterionDownloaded
                                  ? <FiCheckCircle size={18} color="#2f9e44" />
                                  : <FiAlertCircle size={18} color="#f0b400" /> }
                              </span>
                            </td>
                            <td>
                              <Button
                                inline
                                ghost
                                square
                                size="small"
                                color="info"
                                type="button"
                                title="Baixar certificado"
                                onClick={() => handleOpenParticipantModal(certificate, row)}
                              >
                                <FiDownload size={18} />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                ) : certificate.is_default && (
                  <p style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                    Todas as atividades já possuem um modelo específico.
                  </p>
                )}
              </div>
            </CardContainer>
          )
        })}
      </Grid>

      {/* Modal de seleção de participante */}
      {openParticipantModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            width: '100%',
            maxWidth: 480,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #e0e0e0',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiUser size={18} />
                  Selecionar participante
                </span>
                {activitySelected && (
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 400, color: '#888', marginTop: 4 }}>
                    Atividade: {activitySelected}
                  </span>
                )}
              </h2>
              <Button inline onClick={handleCloseParticipantModal} color="secondary" type="button" outline>
                <FiX size={18} />
              </Button>
            </div>

            {/* Busca */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FiSearch size={16} style={{ position: 'absolute', left: 10, color: '#999' }} />
                <input
                  type="text"
                  placeholder="Buscar participante..."
                  value={participantSearch}
                  onChange={e => setParticipantSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Lista */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {loadingParticipants ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>Carregando participantes...</p>
              ) : filteredParticipants.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
                  {participantSearch ? 'Nenhum participante encontrado.' : 'Nenhum participante cadastrado nessa atividade.'}
                </p>
              ) : (
                filteredParticipants.map((participant) => (
                  <button
                    key={participant.id}
                    type="button"
                    disabled={downloadingParticipantId === participant.id}
                    onClick={() => handleSelectParticipant(participant)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      border: 'none',
                      background: 'none',
                      cursor: downloadingParticipantId === participant.id ? 'wait' : 'pointer',
                      opacity: downloadingParticipantId === participant.id ? 0.6 : 1,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderBottom: '1px solid #f5f5f5',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <FiUser size={15} style={{ color: '#888', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>
                        {participant.name}
                        {downloadingParticipantId === participant.id && ' — gerando PDF...'}
                      </span>
                      {participant.functionName && (
                        <span style={{ fontSize: '0.78rem', color: '#888' }}>
                          Função: {participant.functionName}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
