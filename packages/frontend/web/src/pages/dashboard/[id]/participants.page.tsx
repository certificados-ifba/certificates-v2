import {
  Button,
  Card,
  CardIcon,
  Column,
  Container,
  Grid,
  Header,
  Input,
  PaginatedTable
} from '@components'
import { withAuth } from '@hocs'
import { usePaginatedRequest } from '@services'
import { Form } from '@unform/web'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import {
  FiAward,
  FiCalendar,
  FiChevronLeft,
  FiSearch,
  FiUsers
} from 'react-icons/fi'

const DashboardParticipant: React.FC = () => {
  const [event, setEvent] = useState({
    participants: 15,
    certificates: 30,
    download: 15,
    activities: 5,
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
        <title>Participantes | Certificados</title>
      </Head>
      <Header
        title={`Participantes do ${event?.name}`}
        subtitle="Aqui estão as informações sobre os participantes do evento."
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
      <Grid style={{ marginBottom: '10px' }} cols={2}>
        <div>
          <CardIcon
            title="Participantes"
            value={event?.participants + ''}
            icon={<FiUsers size={24} />}
            color="secondary"
          />
        </div>
        <div>
          <CardIcon
            title="Certificados"
            value="30"
            icon={<FiAward size={24} />}
            color="info"
          />
        </div>
      </Grid>
      <Card>
        <header>
          <h2></h2>
          <Form onSubmit={handleFilter}>
            <Input
              name="search"
              placeholder="Buscar participante"
              icon={FiSearch}
            />
          </Form>
        </header>
        <PaginatedTable request={request}>
          <thead>
            <tr>
              <th onClick={() => handleOrder('name')}>
                <Column order={order} selected={column === 'name'}>
                  Nome
                </Column>
              </th>
              <th onClick={() => handleOrder('certificate')}>
                <Column order={order} selected={column === 'certificate'}>
                  Certificados
                </Column>
              </th>
              <th onClick={() => handleOrder('download')}>
                <Column order={order} selected={column === 'download'}>
                  Baixados
                </Column>
              </th>
              <th onClick={() => handleOrder('lastLogin')}>
                <Column order={order} selected={column === 'lastLogin'}>
                  Último Login
                </Column>
              </th>
            </tr>
          </thead>
          <tbody>
            {request.data?.data?.map(participant => (
              <tr key={participant.id}>
                <td>{participant.name}</td>
                <td>15</td>
                <td>2</td>
                <td>
                  <span>
                    {participant.name
                      ? `Acessou em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`
                      : 'Nunca acessou'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </PaginatedTable>
      </Card>
    </Container>
  )
}

export default withAuth(DashboardParticipant)
