import { ICertificate } from './certificate.interface'

export interface ICertificateMarkDownloadedResponse {
  status: number
  message: string
  certificate: ICertificate | null
  errors: { [key: string]: any } | null
}
