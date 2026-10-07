import { ICertificate } from './certificate.interface'

export interface IServiceCertificateMarkDownloadedResponse {
  status: number
  message: string
  certificate: ICertificate | null
  errors: { [key: string]: any }
}
