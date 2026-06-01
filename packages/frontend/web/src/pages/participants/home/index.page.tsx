import { withoutAuth } from '@hocs'
import { ParticipantLayout } from '@layouts'
import { useAuth } from '@providers'
import { api } from '@services'
import { capitalize } from '@utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

import { Certificates } from './components'

interface Participant {
  name: string
  email: string
  cpf: string
  phone: string
  dob: string
  institution: string
}

const Home: React.FC = () => {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [participant, setParticipant] = useState<Participant | null>(null)
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
        const user = data?.data?.user
        if (user) {
          setParticipant({
            name: user.name,
            email: user.email,
            cpf: user.personal_data.cpf,
            phone: user.personal_data.phone,
            dob: user.personal_data.dob,
            institution: user.personal_data.institution ? 'Sim' : 'Não'
          })
        }
        setLoading(false)
      } catch {
        setLoading(false)
        router.replace('/participants/login')
      }
    }
    if (token) load()
  }, [router, token])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('certificates.participant.token')
    router.replace('/participants/login')
  }, [router])

  return (
    <>
      <Head>
        <title>
          {participant ? capitalize(participant.name) : 'Carregando...'} |
          Certificados
        </title>
      </Head>
      <Certificates
        token={token}
        participant={participant}
        loadingParticipant={loading}
        onLogout={handleLogout}
      />
    </>
  )
}

export default withoutAuth(Home, ParticipantLayout)
