import {
  Button,
  Captcha,
  Card,
  FormContent,
  Help,
  Input,
  LogoArea,
  Row
} from '@components'
import { withoutAuth } from '@hocs'
import { useAuth, useToast } from '@providers'
import { FormHandles } from '@unform/core'
import { getValidationErrors, isValidCpf, removeMask } from '@utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useRef, useState } from 'react'
import {
  FiAward,
  FiCalendar,
  FiCheck,
  FiCreditCard,
  FiSearch
} from 'react-icons/fi'
import * as Yup from 'yup'

import { Container, FormArea, TopButton } from './styles'

const Login: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const formRef = useRef<FormHandles>(null)
  const datePickerRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { addToast } = useToast()
  const { auth } = useAuth()

  const handleDatePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value // YYYY-MM-DD
      if (!val) return
      const [year, month, day] = val.split('-')
      const formatted = `${day}/${month}/${year}`
      formRef.current?.setFieldValue('dob', formatted)
    },
    []
  )

  const handleOpenPicker = useCallback(() => {
    const picker = datePickerRef.current
    if (!picker) return
    try {
      picker.showPicker?.()
    } catch {
      picker.click()
    }
  }, [])

  const handleSubmit = useCallback(
    async dataForm => {
      try {
        setLoading(true)
        formRef.current?.setErrors({})
        const schema = Yup.object().shape({
          cpf: Yup.string()
            .matches(
              /(\d{3}).(\d{3}).(\d{3})-(\d{2})/,
              'Por favor, digite um CPF válido.'
            )
            .test('cpf-is-valid', 'CPF precisa ser válido', isValidCpf)
            .required('Digite o seu CPF'),
          dob: Yup.string()
            .matches(/^\d{2}\/\d{2}\/\d{4}$/, 'Digite a data no formato DD/MM/AAAA')
            .required('Digite a sua data de nascimento'),
          token: Yup.string().required('Captcha é obrigatório')
        })
        await schema.validate(dataForm, {
          abortEarly: false
        })
        const [day, month, year] = dataForm.dob.split('/')
        await auth({
          cpf: removeMask(dataForm.cpf),
          dob: `${year}-${month}-${day}`,
          token: dataForm.token
        })
        setLoading(false)
        router.push('/participants/home')
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err)
          formRef.current?.setErrors(errors)
          setLoading(false)
          return
        }
        setLoading(false)
        addToast({
          type: 'error',
          title: 'Erro ao consultar certificado',
          description: err
        })
      }
    },
    [addToast, router, auth]
  )

  return (
    <>
      <TopButton>
        <div>
          <Button
            onClick={() => {
              router.push(`/validate`)
            }}
            size="small"
            type="button"
            inline
          >
            <FiCheck size={20} />
            <span>Validar Certificado</span>
          </Button>
          <Button
            onClick={() => {
              // Outro app: navegação completa, não router.push
              window.location.href = process.env.participantURL
            }}
            size="small"
            type="button"
            inline
          >
            <FiAward size={20} />
            <span>Nova tela do participante</span>
          </Button>

        </div>
      </TopButton>
      <Container maxWidth={500} login={true}>
        <Head>
          <title>Login | Certificados</title>
        </Head>
        <LogoArea />
        <FormArea ref={formRef} onSubmit={handleSubmit}>
          <Card>
            <header>
              <h2>Digite suas informações para continuar</h2>
            </header>
            <FormContent padding={true}>
              <Input
                marginBottom="sm"
                name="cpf"
                label="CPF"
                placeholder="CPF"
                type="cpf-masked"
                icon={FiCreditCard}
                disabled={loading}
              />
              <div style={{ position: 'relative' }}>
                <Input
                  icon={FiCalendar}
                  marginBottom="sm"
                  name="dob"
                  label="Data de Nascimento"
                  type="dob-masked"
                  placeholder="DD/MM/AAAA"
                  disabled={loading}
                />
                <input
                  ref={datePickerRef}
                  type="date"
                  tabIndex={-1}
                  onChange={handleDatePick}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1, top: 0, right: 0, pointerEvents: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => handleOpenPicker()}
                  disabled={loading}
                  title="Selecionar data"
                  style={{
                    position: 'absolute',
                    right: 38,
                    bottom: 18,
                    transform: 'translateY(50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: '#888',
                    lineHeight: 1
                  }}
                >
                  <FiCalendar size={16} />
                </button>
              </div>
              <Captcha name="token" />
              <Row>
                <Button
                  size="big"
                  color="primary"
                  type="submit"
                  loading={loading}
                >
                  <FiSearch size={20} />
                  <span>Encontrar Certificados</span>
                </Button>
              </Row>
              <div style={{ marginTop: '10px' }}>
                <Row>
                  <Button
                    onClick={() => {
                      router.push(`/validate`)
                    }}
                    type="button"
                    ghost
                    link
                  >
                    <FiCheck size={20} />
                    <span>Validar Certificado</span>
                  </Button>
                </Row>
              </div>
              <Help />
            </FormContent>
          </Card>
        </FormArea>
      </Container>
    </>
  )
}

export default withoutAuth(Login)
