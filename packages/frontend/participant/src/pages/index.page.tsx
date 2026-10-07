import HCaptcha from '@hcaptcha/react-hcaptcha'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import {
  Field,
  FieldError,
  FormError,
  LoginCard,
  LoginLogo,
  LoginWrapper,
  SubmitButton
} from '../components/login.styles'
import { api } from '../services/api'
import { formatCpf, formatDob, isValidCpf } from '../services/format'
import { session } from '../services/session'

interface Errors {
  cpf?: string
  dob?: string
  captcha?: string
  form?: string
}

const Login: React.FC = () => {
  const router = useRouter()
  const captchaRef = useRef<HCaptcha>(null)
  const [cpf, setCpf] = useState('')
  const [dob, setDob] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session.get()) router.replace('/certificados')
  }, [router])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const next: Errors = {}
      if (!isValidCpf(cpf)) next.cpf = 'Digite um CPF válido.'
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
        next.dob = 'Digite a data no formato DD/MM/AAAA.'
      }
      if (!captcha) next.captcha = 'Confirme o captcha.'
      setErrors(next)
      if (Object.keys(next).length > 0) return

      const [day, month, year] = dob.split('/')
      try {
        setLoading(true)
        const { data } = await api.post('participants/sessions', {
          cpf: cpf.replace(/\D/g, ''),
          dob: `${year}-${month}-${day}`,
          token: captcha
        })
        session.set(data.data.token)
        router.push('/certificados')
      } catch (err) {
        setLoading(false)
        setCaptcha('')
        captchaRef.current?.resetCaptcha()
        setErrors({
          form:
            err?.response?.status === 401
              ? 'Não encontramos certificados para esse CPF e data de nascimento.'
              : 'Não foi possível entrar agora. Tente novamente em instantes.'
        })
      }
    },
    [captcha, cpf, dob, router]
  )

  return (
    <LoginWrapper>
      <Head>
        <title>Meus Certificados | IFBA</title>
      </Head>
      <LoginCard onSubmit={handleSubmit} noValidate>
        <LoginLogo>
          <img src="/logo-full.svg" alt="Certificados IFBA" />
        </LoginLogo>
        <div>
          <h1>Meus certificados</h1>
          <p>
            Informe seu CPF e data de nascimento para ver e baixar seus
            certificados.
          </p>
        </div>

        {errors.form && <FormError role="alert">{errors.form}</FormError>}

        <Field>
          CPF
          <input
            name="cpf"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => setCpf(formatCpf(e.target.value))}
          />
          {errors.cpf && <FieldError>{errors.cpf}</FieldError>}
        </Field>

        <Field>
          Data de nascimento
          <input
            name="dob"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="DD/MM/AAAA"
            value={dob}
            onChange={e => setDob(formatDob(e.target.value))}
          />
          {errors.dob && <FieldError>{errors.dob}</FieldError>}
        </Field>

        <div>
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.siteKey}
            onVerify={setCaptcha}
            onExpire={() => setCaptcha('')}
          />
          {errors.captcha && <FieldError>{errors.captcha}</FieldError>}
        </div>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Ver meus certificados'}
        </SubmitButton>
      </LoginCard>
    </LoginWrapper>
  )
}

export default Login
