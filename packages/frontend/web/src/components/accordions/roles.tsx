import { FormHandles } from '@unform/core'
import { Form } from '@unform/web'
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  FiAlertCircle,
  FiCheckSquare,
  FiMinus,
  FiPlus,
  FiX
} from 'react-icons/fi'

import { IRole } from '../../dtos/ICertificate'
import api from '../../services/axios'
import { Section } from '../../styles/components/accordion'
import { Accordion } from '../accordion'
import { Alert } from '../alert'
import { Button } from '../button'
import { Modal } from '../modal'
import { Select } from '../select'
import { Table } from '../table'

interface Props {
  eventId?: string
  onFormChange: (formRef: MutableRefObject<FormHandles>) => void
  onRolesChange?: (roles: IRole[]) => void
  isDefault?: boolean
  onDefaultChange?: (value: boolean) => void
  preview?: boolean
  roles?: IRole[]
  // Atividades que já são critério de outro modelo do evento
  unavailableActivityIds?: string[]
  id: string
}

const Roles: React.FC<Props> = ({ eventId, onFormChange, onRolesChange, isDefault, onDefaultChange, preview, roles, unavailableActivityIds, id }) => {
  const formRef = useRef<FormHandles>(null)

  const [roleList, setRoleList] = useState(roles || [])
  const [activityOptions, setActivityOptions] = useState<any[]>([])

  useEffect(() => {
    onFormChange(formRef)
  }, [formRef, onFormChange])

  useEffect(() => {
    if (onRolesChange) {
      onRolesChange(roleList)
    }
  }, [roleList, onRolesChange])

  useEffect(() => {
    if (isDefault) {
      setRoleList([])
    }
  }, [isDefault])

  useEffect(() => {
    if (!eventId) return
    const loadOptions = async () => {
      try {
        const actRes = await api.get(`tipos-certificado/${eventId}/activities`, { params: { sort_by: 'name', order_by: 'ASC' } })
        const activities = (actRes.data?.data || [])
        setActivityOptions(
          activities.map((item: any) => ({
            value: { name: item.name, value: item.id },
            label: item.name
          }))
        )
      } catch (err) {
        console.error('Erro ao carregar atividades do evento:', err)
      }
    }
    loadOptions()
  }, [eventId])

  // Uma atividade só pode ser critério de um modelo: esconde as que já estão
  // em outro modelo do evento e as que já foram adicionadas neste.
  const availableActivityOptions = useMemo(() => {
    const takenIds = new Set([
      ...(unavailableActivityIds || []),
      ...roleList.map((role: any) => String(role.activity?.value || role.activity?.id || role.activity))
    ])
    return activityOptions.filter(option => !takenIds.has(String(option.value.value)))
  }, [activityOptions, unavailableActivityIds, roleList])

  const atvID = 'addActivity' + (preview ? 'modal' : '') + id

  const tableStyle: any = {}

  if (!preview) tableStyle.minWidth = '400px'

  const [openModal, setOpenModal] = useState(false)

  const addRole = useCallback(() => {
    const addActivity = formRef.current.getFieldValue(atvID)
    const error: any = {}
    if (!addActivity) error[atvID] = 'Por favor, selecione uma atividade'
    formRef.current.setErrors(error)
    if (!error[atvID]) {
      setRoleList([
        ...roleList,
        {
          activity: addActivity,
          number:
            roleList.length === 0 ? 1 : roleList[roleList.length - 1].number + 1
        }
      ])
      formRef.current.setFieldValue(atvID, null)
      setOpenModal(false)
    }
  }, [roleList, atvID])

  return (
    <Form
      ref={formRef}
      onSubmit={() => {
        console.log()
      }}
    >
      <Accordion icon={FiCheckSquare} title="Critérios">
        {!preview && (
          <Section paddingTop="md" paddingBottom="md"></Section>
        )}
        {isDefault && (
          <Section paddingTop={preview ? 'md' : undefined} paddingBottom="md">
            <Alert type="warning" icon={FiAlertCircle}>
              Atenção! Este certificado será utilizado para atividades
              que não possuem um modelo definido.<br />
              <b>Verifique se o texto é adequado para esses casos.</b>
            </Alert>
          </Section>
        )}
        {(!isDefault || !preview) && (
        <Section paddingTop={preview ? 'md' : undefined} paddingBottom="md">
          <Table>
            <thead>
              <tr>
                <th>Nº</th>
                <th style={tableStyle}>Atividade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!preview && (
                <>
                  <tr>
                    <td>-</td>
                    <td>
                      <Select
                        formRef={formRef}
                        name={atvID}
                        isSearchable={false}
                        options={availableActivityOptions}
                        isDisabled={isDefault}
                      />
                    </td>
                    <td>
                      <span title={isDefault ? 'Modelo padrão não adiciona critérios' : undefined} style={{ display: 'inline-block' }}>
                        <Button
                          inline
                          square
                          size="small"
                          type="button"
                          onClick={() => addRole()}
                          disabled={isDefault}
                        >
                          <FiPlus size={20} /> <span>Adicionar</span>
                        </Button>
                      </span>
                    </td>
                  </tr>
                </>
              )}
              {roleList.map((role, index) => (
                <tr key={role.number}>
                  <td>{index + 1}</td>
                  <td>{role.activity.name}</td>
                  <td>
                    {!preview && (
                      <Button
                        disabled={roleList.length === 1 || isDefault}
                        ghost
                        inline
                        square
                        color="danger"
                        size="small"
                        type="button"
                        onClick={() => {
                          roleList.splice(roleList.indexOf(role), 1)
                          setRoleList([...roleList])
                        }}
                      >
                        <FiMinus size={20} /> <span>Remover</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>
        )}
        {roleList.length === 0 && !isDefault && (
          <Section paddingBottom="md">
            <Alert type="danger" icon={FiAlertCircle}>
              Você tem que selecionar ao menos 1 critério!
            </Alert>
          </Section>
        )}
      </Accordion>
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <header>
          <h2>Adicionar um Critério</h2>
        </header>
        <main>
          {preview && (
            <Select
              label="Atividade"
              formRef={formRef}
              name={atvID}
              isSearchable={false}
              options={availableActivityOptions}
            />
          )}
        </main>
        <footer>
          <Button
            inline
            outline
            square
            color="secondary"
            onClick={() => {
              setOpenModal(false)
            }}
          >
            <FiX size={20} /> <span>Cancelar</span>
          </Button>
          <Button
            square
            color="success"
            type="button"
            onClick={() => {
              addRole()
            }}
          >
            <FiPlus size={20} /> <span>Adicionar</span>
          </Button>
        </footer>
      </Modal>
    </Form>
  )
}

export default Roles
