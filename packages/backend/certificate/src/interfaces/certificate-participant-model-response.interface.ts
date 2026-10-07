import { IModel } from './model.interface'

export interface ICertificateParticipantModelResponse {
  status: number
  message: string
  data: {
    model: IModel
  } | null
}
