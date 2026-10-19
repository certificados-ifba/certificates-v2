import {
  Button,
  Card,
  CardIcon,
  Column,
  Container,
  Input,
  Grid,
  PaginatedTable,
  Header
} from '@components'
import { withAuth } from '@hocs'
import { usePaginatedRequest } from '@services'
import { theme } from '@styles'
import { Form } from '@unform/web'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import {
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiDownload,
  FiSearch,
  FiSend,
  FiX,
  FiXCircle
} from 'react-icons/fi'

const DashboardCertificate: React.FC = () => {
  const [event, setEvent] = useState({
    download: 50,
    downloadCount: 15,
    notDownloadCount: 30,
    id: '60e8fbac290fc4003284701c',
    name: 'Evento 1'
  })

  const [filters, setFilters] = useState(null)
  const [column, setColumn] = useState('name')
  const [order, setOrder] = useState<'' | 'ASC' | 'DESC'>('ASC')

  const handleOrder = useCallback(
    columnSelected => {
      if (column !== columnSelected) {
        setColumn(columnSelected)
        setOrder('ASC')
      } else {
        setOrder(value =>
          value === '' ? 'ASC' : value === 'ASC' ? 'DESC' : ''
        )
      }
    },
    [column]
  )

  const request = usePaginatedRequest<any>({
    url: 'participants',
    params:
      filters && order !== ''
        ? Object.assign(filters, { sort_by: column, order_by: order })
        : order !== ''
        ? { sort_by: column, order_by: order }
        : filters
  })

  const handleFilter = useCallback(
    data => {
      !data.search && delete data.search
      request.resetPage()
      setFilters(data)
    },
    [request]
  )

  const router = useRouter()

  return (
    <Container>
      <Head>
        <title>Downloads | Certificados</title>
      </Head>
      <Header
        title={`Certificados do ${event?.name}`}
        subtitle="Aqui estão as informações sobre os certificados do evento."
        icon={FiCalendar}
        controls={
          <nav>
            <Button
              color="secondary"
              ghost
              onClick={() => {
                router.push('/dashboard')
              }}
            >
              <FiChevronLeft size={20} />
              <span className="hide-md-down">Voltar</span>
            </Button>
          </nav>
        }
      />
      <Grid style={{ marginBottom: '10px' }} cols={3}>
        <div>
          <CardIcon
            title="Baixaram"
            value={event?.download + '%'}
            icon={<FiDownload size={24} />}
            color="primary"
          />
        </div>
        <div>
          <CardIcon
            title="Baixaram"
            value={event?.downloadCount + ''}
            icon={<FiCheck size={24} />}
            color="primary"
          />
        </div>
        <div>
          <CardIcon
            title="Não Baixaram"
            value={event?.notDownloadCount + ''}
            icon={<FiX size={24} />}
            color="danger"
          />
        </div>
      </Grid>
      <Card>
        <header>
          <h2></h2>
          <Form onSubmit={handleFilter}>
            <Input
              name="search"
              placeholder="Buscar atividade"
              icon={FiSearch}
            />
          </Form>
          <Button
            inline
            color="danger"
            size="small"
            onClick={() => {
              console.log('')
            }}
          >
            <FiSend size={20} />
            <span>Re-enviar para os que não baixaram</span>
          </Button>
        </header>
        <PaginatedTable request={request}>
          <thead>
            <tr>
              <th onClick={() => handleOrder('activity')}>
                <Column order={order} selected={column === 'activity'}>
                  Atividade
                </Column>
              </th>
              <th onClick={() => handleOrder('name')}>
                <Column order={order} selected={column === 'name'}>
                  Nome
                </Column>
              </th>
              <th>Baixou?</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {request.data?.data?.map((participant, index) => (
              <tr key={participant.id}>
                <td>Atividade 1</td>
                <td>{participant.name}</td>
                <td>
                  {index === 0 && (
                    <FiCheckCircle color={theme.colors.success} size={20} />
                  )}
                  {index === 1 && (
                    <FiXCircle color={theme.colors.danger} size={20} />
                  )}
                </td>
                <td>
                  <Button
                    inline
                    onClick={() => {
                      console.log('')
                    }}
                    ghost
                    size="small"
                    color="info"
                  >
                    <FiSend size={20} />
                    <span>Enviar Certificado por E-mail</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </PaginatedTable>
      </Card>
    </Container>
  )
}

export default withAuth(DashboardCertificate)
