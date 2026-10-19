import { IUser } from './user.interface'

export interface ITipoCertificadoListParams {
  user: IUser
  name: string
  page?: number
  perPage?: number
  sortBy: string
  orderBy: 'ASC' | 'DESC'
  status?: string
}
