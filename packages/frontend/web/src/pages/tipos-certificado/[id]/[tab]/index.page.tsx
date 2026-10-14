import { Alert, Button, Container, Header, Tabs } from '@components'
import { ITipoCertificado } from '@dtos'
import { withAuth } from '@hocs'
import { useToast } from '@providers'
import { api } from '@services'
import { formatDate } from '@utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiChevronLeft,
  FiEdit3,
  FiFileText,
  FiInfo,
  FiLayers,
  FiSend
} from 'react-icons/fi'

import { EventActivity, EventInfo } from '../components'
import { EventCertificate, EventDashboard, EventParticipant } from './components'

const EventDetail: React.FC = () => {
  const { push, query } = useRouter()
  const { id } = query
  const [event, setEvent] = useState<ITipoCertificado>(null)
  const { addToast } = useToast()

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

  return (
    <Container>
      <Head>
        <title>{event?.name} | Evento</title>
      </Head>
      <Header
        title={event?.name}
        subtitle={`Início em ${formatDate(
          event?.start_date
        )} e coordenado por ${event?.user?.name}`}
        icon={FiCalendar}
        controls={
          <nav>
            <Button
              color="secondary"
              ghost
              onClick={() => {
                push('/tipos-certificado')
              }}
            >
              <FiChevronLeft size={20} />
              <span className="hide-md-down">Voltar</span>
            </Button>
            {event?.status === 'PUBLISHED' ? (
              <Button
                color="secondary"
                onClick={() => {
                  push(`/tipos-certificado/${event?.id}/publish`)
                }}
              >
                <FiEdit3 size={20} />
                <span className="hide-md-down">Revisar</span>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  push(`/tipos-certificado/${event?.id}/publish`)
                }}
              >
                <FiSend size={20} />
                <span className="hide-md-down">Publicar</span>
              </Button>
            )}
          </nav>
        }
      />
      <Alert
        type={
          event?.status === 'DRAFT'
            ? 'warning'
            : event?.status === 'REVIEW'
            ? 'danger'
            : 'success'
        }
        card
        marginBottom="md"
      >
        <b>Atenção!</b>
        {event?.status === 'DRAFT'
          ? ' Esse evento ainda não foi publicado'
          : event?.status === 'REVIEW'
          ? ' Esse evento está em edição.'
          : ' Esse evento está publicado.'}
        <br />
        <small>
          {event?.status === 'PUBLISHED'
            ? 'Os certificados estão disponíveis para serem baixados pelos participantes.'
            : 'Para os participantes baixarem os certificados ele precisa ser publicado.'}
        </small>
      </Alert>
      <Tabs
        tabs={[
          {
            name: 'Informações',
            icon: FiInfo,
            children: <EventInfo edit event={event} setEvent={setEvent} />,
            path: 'info'
          },
          {
            name: 'Atividades',
            icon: FiFileText,
            children: <EventActivity event={event} />,
            path: 'activities'
          },
          {
            name: 'Modelos de Certificado',
            icon: FiLayers,
            children: <EventCertificate event={event} />,
            path: 'models'
          },
          {
            name: 'Certificados',
            icon: FiAward,
            children: <EventParticipant event={event} />,
            path: 'certificates'
          },
          {
            name: 'Dashboard',
            icon: FiBarChart2,
            children: <EventDashboard event={event} />,
            path: 'dashboard'
          }
        ]}
      />
    </Container>
  )
}

export default withAuth(EventDetail)
