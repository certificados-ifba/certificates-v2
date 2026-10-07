import { IActivity } from '../activity/activity.interface'
import { ITipoCertificado } from '../tipo-certificado/tipo-certificado.interface'
import { IGeneric } from '../generic/generic.interface'
import { IParticipant } from '../participant/participant.interface'

export interface ICertificate {
  id?: string
  activity?: IActivity
  function?: IGeneric
  participant?: IParticipant
  event?: ITipoCertificado
  key?: string
  workload: number
  start_date: Date
  end_date: Date
  authorship_order?: string
  additional_field?: string
  downloads?: Array<{ model: string; downloaded_at: Date }>
}
