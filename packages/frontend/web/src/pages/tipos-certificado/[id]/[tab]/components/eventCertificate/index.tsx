import AddCertificate, { IModelData } from '@components/accordions/addCertificate'
import CertificatePreview from '@components/accordions/certificatePreview'
import { Button } from '@components/button'
import { Grid } from '@components/grid'
import { ICertificate, ITipoCertificado } from '@dtos'
import { useToast } from '@providers'
import { api } from '@services'
import { criterionToRole } from '@utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'

import { Container } from './styles'

interface Props {
  event: ITipoCertificado
}

interface IApiModel {
  id: string
  name: string
  is_default: boolean
  pages: Array<{
    type: string
    image: string
    text: string
    layout: any
  }>
  criterions: Array<{
    activity?: any
    function?: any
    type_activity?: any
  }>
  created_at: string
}

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:4001'

function apiModelToCertificate(model: IApiModel): ICertificate {
  const frontPage = model.pages.find(p => p.type === 'frente')
  const versePage = model.pages.find(p => p.type === 'verso')

  const roles = (model.criterions || []).map(criterionToRole)

  return {
    id: model.id,
    name: model.name,
    front: frontPage
      ? { img: frontPage.image ? `${STORAGE_URL}/upload/${frontPage.image}` : '', text: frontPage.text }
      : { img: '', text: '' },
    verse: versePage
      ? { img: versePage.image ? `${STORAGE_URL}/upload/${versePage.image}` : '', text: versePage.text }
      : undefined,
    roles: roles.length > 0 ? roles : [],
    is_default: model.is_default
  }
}

export const EventCertificate: React.FC<Props> = ({ event }) => {
  const [models, setModels] = useState<IApiModel[]>([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [showAddCertificateForm, setShowAddCertificateForm] = useState(false)
  const [editingModel, setEditingModel] = useState<IApiModel | null>(null)
  const { addToast } = useToast()

  const loadModels = useCallback(async () => {
    if (!event?.id) return
    try {
      setLoadingModels(true)
      const response = await api.get(`tipos-certificado/${event.id}/models`)
      setModels(response.data.data || [])
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao carregar modelos', description: err })
    } finally {
      setLoadingModels(false)
    }
  }, [event?.id, addToast])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const handleDelete = useCallback(async (modelId: string) => {
    if (!confirm('Deseja realmente excluir este modelo?')) return
    try {
      await api.delete(`tipos-certificado/${event?.id}/models/${modelId}`)
      addToast({ type: 'success', title: 'Modelo excluído com sucesso' })
      loadModels()
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao excluir modelo', description: err })
    }
  }, [event?.id, addToast, loadModels])

  const isEditable = event?.status !== 'PUBLISHED'

  const handleAddCertificateSuccess = useCallback(() => {
    setShowAddCertificateForm(false)
    setEditingModel(null)
    loadModels()
  }, [loadModels])

  const handleEdit = useCallback((model: IApiModel) => {
    setEditingModel(model)
    setShowAddCertificateForm(true)
  }, [])

  const defaultModels = useMemo(() => models.filter(m => m.is_default), [models])
  const regularModels = useMemo(() => models.filter(m => !m.is_default), [models])

  // Atividades já usadas como critério por outro modelo (o modelo em edição não conta)
  const activityIdsInOtherModels = useMemo(
    () =>
      models
        .filter(m => m.id !== editingModel?.id)
        .flatMap(m => (m.criterions || []).filter(c => c.activity).map(c => criterionToRole(c, 0).activity.id)),
    [models, editingModel]
  )

  return (
    <Container>
      {/* Formulário de adição/edição de modelo */}
      {isEditable && showAddCertificateForm && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#555', marginBottom: '1rem' }}>
            {editingModel ? 'Editar modelo' : 'Adicionar novo modelo'}
          </h3>
          <AddCertificate
            key={editingModel?.id || 'new'}
            eventId={event?.id}
            edit={!!editingModel}
            modelData={editingModel as IModelData}
            onSuccess={handleAddCertificateSuccess}
            disableDefault={defaultModels.length > 0 && !editingModel?.is_default}
            unavailableActivityIds={activityIdsInOtherModels}
          />
        </div>
      )}

      {/* Modelos cadastrados no evento — não aparecem quando o formulário está aberto */}
      {!showAddCertificateForm && (
        <>
          {loadingModels ? (
            <div style={{ padding: '1rem', color: '#718096' }}>Carregando modelos...</div>
          ) : models.length > 0 ? (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#555', margin: 0 }}>
                  Modelos do Evento
                </h3>
                {isEditable && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '1rem'
                    }}
                  >
                    <Button
                      color="primary"
                      onClick={() => {
                        setEditingModel(null)
                        setShowAddCertificateForm(true)
                      }}
                      type="button"
                      size="small"
                      style={{ width: 'auto' }}
                    >
                      <FiPlus size={14} />
                      <span>Adicionar novo modelo</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Modelo padrão */}
              {defaultModels.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#718096', marginBottom: '0.5rem' }}>
                    Modelo Padrão
                  </h4>
                  <Grid firstWidth="1460px" cols={2}>
                    {defaultModels.map(model => (
                      <div key={model.id}>
                        <CertificatePreview
                          certificate={apiModelToCertificate(model)}
                          handleEdit={() => handleEdit(model)}
                          handleDelete={() => handleDelete(model.id)}
                        />
                      </div>
                    ))}
                  </Grid>
                </div>
              )}

              {/* Modelos regulares */}
              {regularModels.length > 0 && (
                <div>
                  {defaultModels.length > 0 && (
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#718096', marginBottom: '0.5rem' }}>
                      Outros Modelos
                    </h4>
                  )}
                  <Grid firstWidth="1460px" cols={2}>
                    {regularModels.map(model => (
                      <div key={model.id}>
                        <CertificatePreview
                          certificate={apiModelToCertificate(model)}
                          handleEdit={() => handleEdit(model)}
                          handleDelete={() => handleDelete(model.id)}
                        />
                      </div>
                    ))}
                  </Grid>
                </div>
              )}
            </div>
          ) : isEditable ? (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '1rem'
                  }}
                >
                  <Button
                    color="primary"
                    onClick={() => setShowAddCertificateForm(true)}
                    type="button"
                    size="small"
                    style={{ width: 'auto' }}
                  >
                    <FiPlus size={14} />
                    <span>Adicionar novo modelo</span>
                  </Button>
                </div>
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#718096', border: '1px dashed #e2e8f0', borderRadius: '0.375rem' }}>
                <p style={{ margin: 0 }}>Nenhum modelo cadastrado ainda.</p>
                <small>Clique em &quot;Adicionar novo modelo&quot; para criar o primeiro modelo de certificado.</small>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem', marginTop: '1rem', color: '#718096', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
              Nenhum modelo de certificado cadastrado para este evento.
            </div>
          )}
        </>
      )}
    </Container>
  )
}
