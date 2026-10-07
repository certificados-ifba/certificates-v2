import { useEffect, useRef, useState } from 'react'
import {
  FiBook,
  FiCalendar,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiLogOut,
  FiPhoneCall
} from 'react-icons/fi'

import {
  EyeButton,
  LogoutButton,
  UserAvatarButton,
  UserMenuWrapper,
  UserPanel,
  UserPanelAvatar,
  UserPanelBody,
  UserPanelEmail,
  UserPanelFooter,
  UserPanelHeader,
  UserPanelLabel,
  UserPanelName,
  UserPanelRow,
  UserPanelRowRight,
  UserPanelValue
} from '../styles'

export interface Participant {
  name: string
  // Nome como está no cadastro: é o que sai no PDF, igual ao download do admin
  certificateName: string
  email: string
  cpf: string
  phone: string
  dob: string
  institution: string
}

interface Props {
  participant: Participant
  onLogout: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

function maskCpf(cpf: string): string {
  if (!cpf) return ''
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return cpf
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
}

function maskDob(dob: string): string {
  if (!dob) return ''
  const str = String(dob)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return `${str.slice(8, 10)}/${str.slice(5, 7)}/****`
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    return `${str.slice(0, 6)}****`
  }
  return '****'
}

export const UserMenu: React.FC<Props> = ({ participant, onLogout }) => {
  const [open, setOpen] = useState(false)
  const [showCpf, setShowCpf] = useState(false)
  const [showDob, setShowDob] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  /* reset visibility when panel closes */
  useEffect(() => {
    if (!open) {
      setShowCpf(false)
      setShowDob(false)
    }
  }, [open])

  const initials = getInitials(participant.name)

  return (
    <UserMenuWrapper ref={wrapperRef}>
      <UserAvatarButton
        $active={open}
        onClick={() => setOpen(prev => !prev)}
        title="Informações do participante"
      >
        {initials}
      </UserAvatarButton>

      {open && (
        <UserPanel>
          <UserPanelHeader>
            <UserPanelAvatar>{initials}</UserPanelAvatar>
            <div>
              <UserPanelName>{participant.name}</UserPanelName>
              <UserPanelEmail>{participant.email}</UserPanelEmail>
            </div>
          </UserPanelHeader>

          <UserPanelBody>
            {/* CPF — campo sensível */}
            <UserPanelRow>
              <UserPanelLabel>
                <FiCreditCard size={12} />
                CPF
              </UserPanelLabel>
              <UserPanelRowRight>
                <UserPanelValue>
                  {showCpf ? participant.cpf : maskCpf(participant.cpf)}
                </UserPanelValue>
                <EyeButton
                  onClick={() => setShowCpf(v => !v)}
                  title={showCpf ? 'Ocultar CPF' : 'Revelar CPF'}
                >
                  {showCpf ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                </EyeButton>
              </UserPanelRowRight>
            </UserPanelRow>

            {/* Data de Nascimento — campo sensível */}
            <UserPanelRow>
              <UserPanelLabel>
                <FiCalendar size={12} />
                Nascimento
              </UserPanelLabel>
              <UserPanelRowRight>
                <UserPanelValue>
                  {showDob ? participant.dob : maskDob(participant.dob)}
                </UserPanelValue>
                <EyeButton
                  onClick={() => setShowDob(v => !v)}
                  title={showDob ? 'Ocultar data' : 'Revelar data'}
                >
                  {showDob ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                </EyeButton>
              </UserPanelRowRight>
            </UserPanelRow>

            {/* Telefone */}
            <UserPanelRow>
              <UserPanelLabel>
                <FiPhoneCall size={12} />
                Telefone
              </UserPanelLabel>
              <UserPanelValue>{participant.phone}</UserPanelValue>
            </UserPanelRow>

            {/* Instituição */}
            <UserPanelRow>
              <UserPanelLabel>
                <FiBook size={12} />
                Instituição
              </UserPanelLabel>
              <UserPanelValue>{participant.institution}</UserPanelValue>
            </UserPanelRow>
          </UserPanelBody>

          <UserPanelFooter>
            <LogoutButton onClick={onLogout}>
              <FiLogOut size={14} />
              Sair
            </LogoutButton>
          </UserPanelFooter>
        </UserPanel>
      )}
    </UserMenuWrapper>
  )
}
