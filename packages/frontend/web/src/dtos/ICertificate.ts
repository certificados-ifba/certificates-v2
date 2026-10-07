import { IParticipant } from './IParticipant'

// Componente para exibir informações do certificado
interface ICertificate {
  id?: string
  activity?: string
  function?: string
  participant?: IParticipant
  event?: string
  workload?: number
  start_date?: Date
  end_date?: Date
  authorship_order?: string
  additional_field?: string
  name?: string
  front?: {
    img: string
    text: string
  }
  verse?: {
    img: string
    text: string
  }
  roles?: Array<{
    number: number
    activity: { name: string; id: string }
  }>
  is_default?: boolean
  edit?: boolean
  confirmed?: boolean
}

export interface IRole {
  number: number
  activity: { name: string; id: string }
  // Critério no formato antigo (tipo de atividade + função), preservado ao salvar
  legacy?: { type_activity: string; function: string }
}

export type { ICertificate }
export default ICertificate
