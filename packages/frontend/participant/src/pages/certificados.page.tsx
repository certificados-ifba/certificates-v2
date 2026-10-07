import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

import { Certificates } from '../components/certificates'
import { Participant } from '../components/userMenu'
import { api } from '../services/api'
import { capitalize } from '../services/format'
import { session } from '../services/session'

const formatDob = (dob: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dob || ''))
  return match ? `${match[3]}/${match[2]}/${match[1]}` : dob
}

const CertificatesPage: React.FC = () => {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = useCallback(() => {
    session.clear()
    router.replace('/')
  }, [router])

  useEffect(() => {
    const stored = session.get()
    if (!stored) {
      router.replace('/')
      return
    }
    setToken(stored)
  }, [router])

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const { data } = await api.get('me', {
          headers: { authorization: `Bearer ${token}` }
        })
        const user = data?.data?.user
        setParticipant({
          name: capitalize(user?.name),
          email: user?.email,
          cpf: user?.personal_data?.cpf,
          phone: user?.personal_data?.phone,
          dob: formatDob(user?.personal_data?.dob),
          institution: user?.personal_data?.institution ? 'Sim' : 'Não'
        })
        setLoading(false)
      } catch {
        handleLogout()
      }
    }
    load()
  }, [token, handleLogout])

  return (
    <>
      <Head>
        <title>
          {participant ? `${participant.name} | ` : ''}Meus Certificados
        </title>
      </Head>
      {token && (
        <Certificates
          token={token}
          participant={participant}
          loadingParticipant={loading}
          onLogout={handleLogout}
          onUnauthorized={handleLogout}
        />
      )}
    </>
  )
}

export default CertificatesPage
