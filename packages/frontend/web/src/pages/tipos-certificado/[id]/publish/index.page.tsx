import {
  Alert,
  Button,
  Card,
  Container,
  Header,
  Stepper
} from '@components'
import { withAuth } from '@hocs'
import { useToast } from '@providers'
import { api } from '@services'
import { getModelRows, isModelRowPending } from '@utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiSend
} from 'react-icons/fi'

import { EventInfo } from '../components'
import {
  EventActivity,
  EventCertificate,
  EventCertificatesStep,
  PublishSuccess
} from './components'
import { CardHeader } from './styles'

const infoName = 'Informações'
const activityName = 'Atividades'
const modelName = 'Modelos de Certificados'
const certificateName = 'Certificados'
const endName = 'Pronto'

const stepList = [
  { id: 0, name: infoName },
  { id: 1, name: activityName },
  { id: 2, name: modelName },
  { id: 3, name: certificateName },
  { id: 4, name: endName }
]

const Publish: React.FC = () => {
  const router = useRouter()
  const { id } = router?.query
  const [event, setEvent] = useState(null)
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get(`tipos-certificado/${id}`)

        const event = response?.data?.data

        if (event) {
          setEvent(event)
        }
      } catch (err) {
        addToast({
          title: 'Erro no carregamento',
          type: 'error',
          description: err
        })
        history.back()
      }
    }
    if (id) loadData()
  }, [id, addToast])

  const stepNames = [infoName, activityName, modelName, certificateName, endName]
  const [step, setStep] = useState(0)
  const currentStep = stepNames[step]

  // Evento já publicado: o wizard entra em modo de revisão (somente leitura /
  // download). Não há passo "Pronto" nem ação de publicar.
  const isPublished = event?.status === 'PUBLISHED'
  const visibleSteps = isPublished
    ? stepList.filter(s => s.name !== endName)
    : stepList

  const publish = useCallback(async () => {
    setLoading(true)
    try {
      // Validação: buscar modelos, certificados e atividades antes de publicar
      const [modelsResponse, certsResponse, activitiesResponse] =
        await Promise.all([
          api.get(`tipos-certificado/${id}/models`),
          api.get(`tipos-certificado/${id}/certificates`, {
            params: { take: 100, skip: 0 }
          }),
          api.get(`tipos-certificado/${id}/activities`, {
            params: { sort_by: 'name', order_by: 'ASC' }
          })
        ])
      const models: Array<{
        id: string
        name: string
        is_default: boolean
        criterions: Array<{ activity?: any; function?: any; type_activity?: any }>
        updated_at?: string
      }> = modelsResponse?.data?.data || []
      const certificates: any[] = certsResponse?.data?.data || []
      const activities: any[] = activitiesResponse?.data?.data || []

      const hasDefaultModel = models.some(m => m.is_default)
      if (!hasDefaultModel) {
        addToast({
          type: 'error',
          title: 'Modelo padrão ausente',
          description:
            'É necessário ter pelo menos um modelo de certificado marcado como padrão para publicar o evento.'
        })
        setLoading(false)
        return false
      }

      const regularModels = models.filter(m => !m.is_default)
      const regularWithoutCriterion = regularModels.filter(
        m => !m.criterions || m.criterions.length === 0
      )
      if (regularWithoutCriterion.length > 0) {
        addToast({
          type: 'error',
          title: 'Critérios ausentes',
          description:
            'Todos os modelos comuns (não padrão) precisam ter pelo menos um critério cadastrado antes de publicar o evento.'
        })
        setLoading(false)
        return false
      }

      // Validação: todo modelo precisa ter seus certificados baixados (mesmas
      // linhas que o assistente mostra; linha sem certificado não pende)
      const pendingModels = models.filter(model =>
        getModelRows(model, models, activities, certificates).some(row =>
          isModelRowPending(row, model.id, model.updated_at)
        )
      )
      if (pendingModels.length > 0) {
        addToast({
          type: 'error',
          title: 'Certificados não baixados',
          description: `Baixe ao menos um certificado de cada atividade antes de publicar. Modelos pendentes: ${pendingModels
            .map(m => m.name)
            .join(', ')}.`
        })
        setLoading(false)
        return false
      }

      await api.post(`tipos-certificado/${id}/publish`, {})
      setLoading(false)
      return true
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao publicar evento',
        description: err
      })
      setLoading(false)
      return false
    }
  }, [addToast, id])

  return (
    <Container>
      <Head>
        <title>
          {isPublished ? 'Revisar' : 'Publicar'} {event?.name} | Evento
        </title>
      </Head>
      <Header
        title={`${isPublished ? 'Revisar' : 'Publicar'} ${event?.name}`}
        icon={isPublished ? FiEye : FiSend}
      />
      {currentStep !== endName && (
        <Alert
          marginBottom="md"
          card={true}
          type={isPublished ? 'success' : 'warning'}
        >
          <b>Atenção!</b>{' '}
          {isPublished
            ? 'Esse evento já está publicado. Você pode revisar as informações e baixar os certificados.'
            : 'Revise as informações antes de publicar o evento.'}
        </Alert>
      )}
      {currentStep !== endName && (
        <Stepper steps={visibleSteps} current={step} />
      )}
      <Card>
        <CardHeader>
          <Button
            disabled={currentStep === endName}
            ghost
            color="secondary"
            size="default"
            type="button"
            onClick={() => {
              if (currentStep === infoName) {
                router.push(`/tipos-certificado/${event.id}/info`)
              } else {
                setStep(s => s - 1)
              }
            }}
            inline
          >
            <FiChevronLeft size={20} />
            <span>Voltar</span>
          </Button>
          <Button
            color="primary"
            size="default"
            type="button"
            loading={loading}
            disabled={loading}
            onClick={() => {
              if (currentStep === endName) {
                router.push(`/tipos-certificado/${event.id}/info`)
              } else if (currentStep === certificateName) {
                if (isPublished) {
                  router.push(`/tipos-certificado/${event.id}/info`)
                } else {
                  publish().then(success => {
                    if (success) setStep(s => s + 1)
                  })
                }
              } else {
                setStep(s => s + 1)
              }
            }}
            inline
          >
            {currentStep === endName && (
              <>
                <FiCheck size={20} />
                <span>Concluir</span>
              </>
            )}
            {currentStep === certificateName && (
              <>
                <FiCheck size={20} />
                <span>{isPublished ? 'Concluir revisão' : 'Publicar'}</span>
              </>
            )}
            {currentStep !== certificateName && currentStep !== endName && (
              <>
                <FiChevronRight size={20} />
                <span>Avançar</span>
              </>
            )}
          </Button>
        </CardHeader>
        {currentStep === infoName && (
          <EventInfo edit={false} event={event} setEvent={setEvent} />
        )}
        {currentStep === activityName && (
          <EventActivity addToast={addToast} event={event} />
        )}
        {currentStep === modelName && <EventCertificate event={event} />}
        {currentStep === certificateName && (
          <EventCertificatesStep event={event} />
        )}
        {currentStep === endName && <PublishSuccess />}
      </Card>
    </Container>
  )
}

export default withAuth(Publish)
