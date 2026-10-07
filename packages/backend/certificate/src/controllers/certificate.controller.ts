import { Controller, HttpStatus } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'

import { ICertificateByIdResponse } from '../interfaces/certificate-by-id-response.interface'
import { ICertificateCreateResponse } from '../interfaces/certificate-create-response.interface'
import { ICertificateDeleteResponse } from '../interfaces/certificate-delete-response.interface'
import { ICertificateIssuedResponse } from '../interfaces/certificate-issued-response.interface'
import { ICertificateListParams } from '../interfaces/certificate-list-params.interface'
import { ICertificateListResponse } from '../interfaces/certificate-list-response.interface'
import { ICertificateMarkDownloadedResponse } from '../interfaces/certificate-mark-downloaded-response.interface'
import { ICertificateValidateResponse } from '../interfaces/certificate-validate-response.interface'
import { ICertificate } from '../interfaces/certificate.interface'
import { CertificateService } from '../services/certificate.service'
import { ModelService } from '../services/model.service'

@Controller()
export class CertificateController {
  constructor(
    private readonly certificateService: CertificateService,
    private readonly modelService: ModelService
  ) {}

  @MessagePattern('certificate_list')
  public async certificateList(
    params: ICertificateListParams
  ): Promise<ICertificateListResponse> {
    if (params.event || params.user) {
      const certificates = await this.certificateService.listCertificates(
        params
      )

      return {
        status: HttpStatus.OK,
        message: 'certificate_list_success',
        data: certificates
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'certificate_list_bad_request',
        data: null
      }
    }
  }

  @MessagePattern('certificate_validate')
  public async validateCertificate(params: {
    key: string
  }): Promise<ICertificateValidateResponse> {
    let result: ICertificateValidateResponse

    if (params?.key) {
      const certificate = await this.certificateService.findCertificateByKey(
        params.key
      )

      if (certificate) {
        const activityType = await this.certificateService.findGenericById(
          certificate.activity.type
        )
        result = {
          status: HttpStatus.OK,
          message: 'certificate_validate_success',
          data: {
            participant: certificate.participant.name,
            activity: certificate.activity.name,
            activityType: activityType.name,
            workload: certificate.workload,
            start_date: certificate.start_date,
            end_date: certificate.end_date,
            function: certificate.function.name,
            event: certificate.event.name
          }
        }
      } else {
        result = {
          status: HttpStatus.NOT_FOUND,
          message: 'certificate_validate_not_found',
          data: null
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'certificate_validate_bad_request',
        data: null
      }
    }

    return result
  }

  @MessagePattern('certificate_get_by_id')
  public async getCertificateById(params: {
    id: string
  }): Promise<ICertificateByIdResponse> {
    let result: ICertificateByIdResponse

    if (params?.id) {
      const certificate = await this.certificateService.findCertificateById(
        params.id
      )
      if (certificate) {
        result = {
          status: HttpStatus.OK,
          message: 'certificate_get_by_id_success',
          data: { certificate }
        }
      } else {
        result = {
          status: HttpStatus.NOT_FOUND,
          message: 'certificate_get_by_id_not_found',
          data: null
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'certificate_get_by_id_bad_request',
        data: null
      }
    }

    return result
  }

  @MessagePattern('certificate_create')
  public async certificateCreate(
    certificateBody: ICertificate
  ): Promise<ICertificateCreateResponse> {
    let result: ICertificateCreateResponse

    if (certificateBody) {
      try {
        const certificate = await this.certificateService.createCertificate(
          certificateBody
        )
        result = {
          status: HttpStatus.CREATED,
          message: 'certificate_create_success',
          certificate,
          errors: null
        }
      } catch (e) {
        const errorMessage =
          e.message || 'certificate_create_precondition_failed'
        result = {
          status: HttpStatus.PRECONDITION_FAILED,
          message: errorMessage,
          certificate: null,
          errors: e.errors || { message: errorMessage }
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'certificate_create_bad_request',
        certificate: null,
        errors: null
      }
    }

    return result
  }

  @MessagePattern('certificate_delete_by_id')
  public async certificateDeleteForUser(params: {
    id: string
    permission: boolean
  }): Promise<ICertificateDeleteResponse> {
    let result: ICertificateDeleteResponse

    if (params && params.id) {
      try {
        const certificate = await this.certificateService.findCertificateById(
          params.id
        )

        if (certificate) {
          await this.certificateService.removeCertificateById(params.id)
          result = {
            status: HttpStatus.OK,
            message: 'certificate_delete_by_id_success',
            errors: null
          }
        } else {
          result = {
            status: HttpStatus.NOT_FOUND,
            message: 'certificate_delete_by_id_not_found',
            errors: null
          }
        }
      } catch (e) {
        result = {
          status: HttpStatus.FORBIDDEN,
          message: 'certificate_delete_by_id_forbidden',
          errors: null
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'certificate_delete_by_id_bad_request',
        errors: null
      }
    }

    return result
  }

  @MessagePattern('certificate_mark_downloaded')
  public async certificateMarkDownloaded(params: {
    id: string
    event: string
    model_id: string
  }): Promise<ICertificateMarkDownloadedResponse> {
    let result: ICertificateMarkDownloadedResponse

    if (params && params.id && params.event && params.model_id) {
      try {
        const certificate = await this.certificateService.findCertificateById(
          params.id
        )
        const model = await this.modelService.findModelById(params.model_id)

        // Certificado e modelo precisam ser do evento informado (dono conferido no gateway)
        if (
          certificate &&
          model &&
          String(certificate.event) === String(params.event) &&
          String(model.event) === String(params.event)
        ) {
          const updated = await this.certificateService.markCertificateAsDownloaded(
            params.id,
            params.model_id
          )
          result = {
            status: HttpStatus.OK,
            message: 'certificate_mark_downloaded_success',
            certificate: updated,
            errors: null
          }
        } else {
          result = {
            status: HttpStatus.NOT_FOUND,
            message: 'certificate_mark_downloaded_not_found',
            certificate: null,
            errors: null
          }
        }
      } catch (e) {
        const errorMessage = e.message || 'certificate_mark_downloaded_precondition_failed'
        result = {
          status: HttpStatus.PRECONDITION_FAILED,
          message: errorMessage,
          certificate: null,
          errors: e.errors || { message: errorMessage }
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'certificate_mark_downloaded_bad_request',
        certificate: null,
        errors: null
      }
    }

    return result
  }

  @MessagePattern('certificate_issued')
  public async getCertificateIssued(): Promise<ICertificateIssuedResponse> {
    const quantity = await this.certificateService.getCertificateIssued()

    return {
      status: HttpStatus.OK,
      message: 'get_certificate_issued_success',
      data: quantity
    }
  }
}
