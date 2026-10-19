import { LogoFull, LogoSimple } from '@assets'
import { ActiveLink } from '@components'
import { useAuth, SidebarContext } from '@providers'
import { useEffect, useContext, useState } from 'react'
import {
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiUserCheck,
  FiUsers
} from 'react-icons/fi'
import { IconType } from 'react-icons/lib'

import { Container, LogoArea, ScrollBar, Buttons } from './styles'

interface Item {
  name: string
  link: string
  icon: IconType
  hidden?: boolean
  activeLinks?: string[]
}

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const { isActive, hideSidebar } = useContext(SidebarContext)

  const active = isActive ? 'active' : ''
  const Logo = isActive ? LogoFull : LogoSimple

  useEffect(() => {
    if (items.length === 0) {
      setItems([
        {
          name: 'Dashboard',
          link: '/dashboard',
          icon: FiBarChart2,
          activeLinks: ['/dashboard', '/dashboard/[id]/participants', '/dashboard/[id]/certificates']
        },
        {
          name: 'Eventos',
          link: '/tipos-certificado',
          icon: FiCalendar,
          activeLinks: ['/tipos-certificado', '/tipos-certificado/[tab]/[id]']
        },
        {
          name: 'Participantes',
          link: '/participants',
          icon: FiUserCheck
        },
        {
          name: 'Usuários',
          link: '/users',
          icon: FiUsers,
          hidden: !isAdmin
        },
        {
          name: 'Configurações',
          link: '/settings/text',
          icon: FiSettings,
          activeLinks: ['/settings/[tab]']
        }
      ])
    }
  }, [items, isAdmin])

  return (
    <Container className={active}>
      <LogoArea>
        <Logo />
      </LogoArea>
      <Buttons>
        <ScrollBar>
          {items.map(({ name, link, icon: Icon, activeLinks, hidden }, key) => (
            <li key={key} onClick={hideSidebar} hidden={hidden}>
              <ActiveLink href={link} activeLinks={activeLinks}>
                <a>
                  <Icon size={24} />
                  <span>{name}</span>
                </a>
              </ActiveLink>
            </li>
          ))}
        </ScrollBar>
      </Buttons>
    </Container>
  )
}
