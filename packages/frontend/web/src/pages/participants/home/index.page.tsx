import { Alert, Button, Card, Grid, Loading } from '@components'
import { withoutAuth } from '@hocs'
import { ParticipantLayout } from '@layouts'
import { useAuth } from '@providers'
import { api } from '@services'
import { capitalize, maskDob, maskEmail } from '@utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  FiBook,
  FiCalendar,
  FiChevronLeft,
  FiCreditCard,
  FiMail,
  FiPhoneCall,
  FiUser
} from 'react-icons/fi'

import { Certificates } from './components'
import { Container, FormContainer } from './styles'

const maskCpf = (cpf: string): string => {
  if (!cpf) return ''
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return cpf
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
}

const Home: React.FC = () => {
  const [token, setToken] = useState(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [participant, setParticipant] = useState(null)
  const { getToken } = useAuth()

  useEffect(() => {
    if (!token) {
      const t = getToken()
      if (t) {
        setToken(t)
      } else {
        router.replace('/participants/login')
      }
    }
  }, [getToken, token, router])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('me', {
          headers: { authorization: `Bearer ${token}` }
        })

        const participant = data?.data?.user
        if (participant) {
          setParticipant({
            name: participant.name,
            email: participant.email,
            cpf: participant.personal_data.cpf,
            phone: participant.personal_data.phone,
            dob: participant.personal_data.dob,
            institution: participant.personal_data.institution ? 'Sim' : 'Não'
          })
        }
        setLoading(false)
      } catch (err) {
        setLoading(false)
        router.replace('/participants/login')
      }
    }
    if (token) load()
  }, [getToken, router, token])

  return (
    <Container maxWidth={1500} login={false}>
      <Head>
        <title>
          {participant ? capitalize(participant.name) : 'Carregando...'} |
          Certificados
        </title>
      </Head>
      <Card>
        <header>
          <h2>
            <FiUser size={30} /> <span>Informações Pessoais</span>
            <Button
              color="secondary"
              ghost
              inline
              onClick={() => {
                router.push('/participants/login')
              }}
            >
              <FiChevronLeft size={20} />
              <span className="hide-md-down">Voltar</span>
            </Button>
          </h2>
        </header>
        <Loading active={loading} />
        {!loading && participant && (
          <FormContainer paddingSize="md" padding={true}>
            <Grid cols={3}>
              <div>
                <Alert marginBottom="sm" size="sm">
                  Nome:
                </Alert>
                <Alert icon={FiUser}>
                  <b>{capitalize(participant.name)}</b>
                </Alert>
              </div>
              <div>
                <Alert marginBottom="sm" size="sm">
                  E-mail:
                </Alert>
                <Alert icon={FiMail}>
                  <b>{maskEmail(participant.email)}</b>
                </Alert>
              </div>
              <div>
                <Alert marginBottom="sm" size="sm">
                  CPF:
                </Alert>
                <Alert icon={FiCreditCard}>
                  <b>{maskCpf(participant.cpf)}</b>
                </Alert>
              </div>
            </Grid>
            <div style={{ marginTop: '15px' }}>
              <Grid cols={3}>
                <div>
                  <Alert marginBottom="sm" size="sm">
                    Data de Nascimento:
                  </Alert>
                  <Alert icon={FiCalendar}>
                    <b>{maskDob(participant.dob)}</b>
                  </Alert>
                </div>
                <div>
                  <Alert marginBottom="sm" size="sm">
                    Telefone:
                  </Alert>
                  <Alert icon={FiPhoneCall}>
                    <b>{participant.phone}</b>
                  </Alert>
                </div>
                <div>
                  <Alert marginBottom="sm" size="sm">
                    É da Instituição?
                  </Alert>
                  <Alert icon={FiBook}>
                    <b>{participant.institution}</b>
                  </Alert>
                </div>
              </Grid>
            </div>
          </FormContainer>
        )}
      </Card>
      {/* {!loading && <Events token={token} loading={loading} />} */}
      {!loading && <Certificates token={token} loading={loading} />}
    </Container>
  )
}

export default withoutAuth(Home, ParticipantLayout)
