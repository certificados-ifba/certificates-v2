import {
  Button,
  Card,
  Loading,
  PaginatedTable,
  TableRow
} from '@components'
import { usePaginatedRequest } from '@services'
import {
  FiDownload,
  FiExternalLink,
  FiFileText
} from 'react-icons/fi'

interface Props {
  token: string
  loading: boolean
}

export const Certificates: React.FC<Props> = ({ token, loading }) => {
  const requestCertificate = usePaginatedRequest<any>({
    url: 'me/certificates',
    headers: { authorization: `Bearer ${token}` }
  })

  return (
    <div style={{ marginTop: '15px' }}>
      <Card>
        <header>
          <h2>
            <FiFileText size={30} />
            <span>Seus Certificados</span>
          </h2>
          {/* {!loading && (
            <Form onSubmit={handleFilterCertificate}>
              <Input
                name="search"
                placeholder="Buscar certificado"
                icon={FiSearch}
              />
            </Form>
          )} */}
        </header>
        <Loading active={loading} />
        {!loading && (
          <PaginatedTable request={requestCertificate}>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Atividade</th>
                <th>Função</th>
                <th>Carga Horária</th>
                <th>Emissão</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requestCertificate.data?.data?.map(
                (
                  { activity, created_at, event, function: role, workload },
                  key
                ) => (
                  <tr key={key}>
                    <td>{event?.name}</td>
                    <td>{activity?.name}</td>
                    <td>{role?.name}</td>
                    <td>{workload}</td>
                    <td>{new Date(created_at).toLocaleString()}</td>
                    <td>
                      <TableRow>
                        <Button
                          ghost
                          inline
                          square
                          color="secondary"
                          size="small"
                          onClick={() => {
                            console.log()
                          }}
                        >
                          <FiExternalLink size={20} />
                          <span>Visualizar</span>
                        </Button>
                        <span style={{ marginLeft: '10px' }}>
                          <Button
                            inline
                            square
                            color="secondary"
                            size="small"
                            onClick={() => {
                              console.log()
                            }}
                          >
                            <FiDownload size={20} />
                            <span>Baixar</span>
                          </Button>
                        </span>
                      </TableRow>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </PaginatedTable>
        )}
      </Card>
    </div>
  )
}
