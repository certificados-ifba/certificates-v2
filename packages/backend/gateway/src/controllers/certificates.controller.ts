import {
  Controller,
  Inject,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpException,
  HttpStatus,
  Res,
  Query
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth
} from '@nestjs/swagger'
import { Response } from 'express'

import { Authorization } from '../decorators/authorization.decorator'
import { Permission } from '../decorators/permission.decorator'
import { CertificateIdDto } from '../interfaces/certificate/dto/certificate-id.dto'
import { CertificateValidateResponseDto } from '../interfaces/certificate/dto/certificate-validate-response.dto'
import { CertificateValidateDto } from '../interfaces/certificate/dto/certificate-validate.dto'
import { CreateCertificateResponseDto } from '../interfaces/certificate/dto/create-certificate-response.dto'
import { CreateCertificateDto } from '../interfaces/certificate/dto/create-certificate.dto'
import { DeleteCertificateResponseDto } from '../interfaces/certificate/dto/delete-certificate-response.dto'
import { TipoCertificadoIdDto } from '../interfaces/certificate/dto/event-id.dto'
import { ListCertificateResponseDto } from '../interfaces/certificate/dto/list-certificate-response.dto'
import { ListCertificateDto } from '../interfaces/certificate/dto/list-certificate.dto'
import { MarkCertificateDownloadedDto } from '../interfaces/certificate/dto/mark-certificate-downloaded.dto'
// import { TipoCertificadoIdDto } from '../interfaces/certificate/dto/event-id.dto'
// import { ListCertificateResponseDto } from '../interfaces/certificate/dto/list-certificate-response.dto'
// import { ListCertificateDto } from '../interfaces/certificate/dto/list-certificate.dto'
import { IServiceCertificateCreateResponse } from '../interfaces/certificate/service-certificate-create-response.interface'
import { IServiceCertificateDeleteResponse } from '../interfaces/certificate/service-certificate-delete-response.interface'
import { IServiceCertificateListResponse } from '../interfaces/certificate/service-certificate-list-response.interface'
import { IServiceCertificateMarkDownloadedResponse } from '../interfaces/certificate/service-certificate-mark-downloaded-response.interface'
import { IServiceCertificateValidateResponse } from '../interfaces/certificate/service-certificate-validate-response.interface'
// import { IServiceCertificateListResponse } from '../interfaces/certificate/service-certificate-list-response.interface'
import { IAuthorizedRequest } from '../interfaces/common/authorized-request.interface'
import { IServiceTipoCertificadoGetByIdResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-get-by-id-response.interface'
import { IServiceParticipantGetByIdResponse } from '../interfaces/participant/service-participant-get-by-id-response.interface'
// import capitalize from '../utils/capitalize'

@Controller('')
@ApiBearerAuth('JWT')
@ApiTags('certificates')
export class CertificatesController {
  constructor(
    @Inject('CERTIFICATE_SERVICE')
    private readonly certificateServiceClient: ClientProxy,
    @Inject('TIPO_CERTIFICADO_SERVICE')
    private readonly eventServiceClient: ClientProxy,
    @Inject('USER_SERVICE')
    private readonly userServiceClient: ClientProxy
  ) {}

  @Get('certificates/validate/:key')
  // @Authorization(true)
  // @Permission('certificate_get_by_id')
  @ApiOkResponse({
    type: CertificateValidateResponseDto,
    description: 'Find certificate by id'
  })
  public async validateCertificate(
    @Param() params: CertificateValidateDto
  ): Promise<CertificateValidateResponseDto> {
    const { key } = params

    const certificateResponse: IServiceCertificateValidateResponse = await this.certificateServiceClient
      .send('certificate_validate', { key })
      .toPromise()

    if (certificateResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: certificateResponse.message,
          data: null
        },
        certificateResponse.status
      )
    }

    return {
      message: certificateResponse.message,
      data: certificateResponse?.data
    }
  }

  @Get([
    'events/:event_id/certificates',
    'tipos-certificado/:event_id/certificates'
  ])
  @Authorization(true)
  @Permission('certificate_list')
  @ApiOkResponse({
    type: ListCertificateResponseDto,
    description: 'List of certificates'
  })
  public async getCertificates(
    @Req() request: IAuthorizedRequest,
    @Param() params: TipoCertificadoIdDto,
    @Res({ passthrough: true }) res: Response,
    @Query() query: ListCertificateDto
  ): Promise<ListCertificateResponseDto> {
    const {
      search,
      activity,
      typeActivity,
      function: _function,
      workload_min,
      workload_max,
      start_date_from,
      start_date_to,
      end_date_from,
      end_date_to,
      page,
      per_page,
      sort_by,
      order_by
    } = query

    const eventResponse: IServiceTipoCertificadoGetByIdResponse = await this.eventServiceClient
      .send('tipo_certificado_get_by_id', {
        id: params.event_id,
        user: request.user
      })
      .toPromise()

    if (eventResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: eventResponse.message,
          data: null,
          errors: null
        },
        eventResponse.status
      )
    }

    const certificatesResponse: IServiceCertificateListResponse = await this.certificateServiceClient
      .send('certificate_list', {
        name: search,
        activity,
        typeActivity,
        function: _function,
        workloadMin: workload_min,
        workloadMax: workload_max,
        startDateFrom: start_date_from,
        startDateTo: start_date_to,
        endDateFrom: end_date_from,
        endDateTo: end_date_to,
        event: eventResponse.data.event.id,
        page: Number(page),
        perPage: Number(per_page),
        sortBy: sort_by,
        orderBy: order_by
      })
      .toPromise()

    res.header('x-total-count', String(certificatesResponse?.data.totalCount))
    res.header('x-total-page', String(certificatesResponse?.data.totalPages))

    return {
      message: certificatesResponse.message,
      data: certificatesResponse?.data?.certificates
    }
  }

  @Post([
    'events/:event_id/certificates',
    'tipos-certificado/:event_id/certificates'
  ])
  @Authorization(true)
  @Permission('certificate_create')
  @ApiCreatedResponse({
    type: CreateCertificateResponseDto
  })
  public async createCertificate(
    @Req() request: IAuthorizedRequest,
    @Param() params: CertificateIdDto,
    @Body() certificateRequest: CreateCertificateDto
  ): Promise<CreateCertificateResponseDto> {
    const {
      activity,
      function: _function,
      workload,
      start_date,
      end_date,
      authorship_order,
      additional_field,
      participant,
      cpf
    } = certificateRequest

    let participantId = participant
    if (!participantId && cpf) {
      const cleanCpf = cpf.replace(/[^\d]+/g, '')
      const userResponse: IServiceParticipantGetByIdResponse = await this.userServiceClient
        .send('user_get_by_cpf', cleanCpf)
        .toPromise()

      if (userResponse.status !== HttpStatus.OK) {
        throw new HttpException(
          {
            message: 'CPF válido, porém o participante não está cadastrado',
            data: null,
            errors: null
          },
          HttpStatus.NOT_FOUND
        )
      }
      participantId = userResponse.data.user.id
    }

    if (!participantId) {
      throw new HttpException(
        {
          message: 'É necessário informar o participante ou o CPF',
          data: null,
          errors: null
        },
        HttpStatus.BAD_REQUEST
      )
    }

    const eventResponse: IServiceTipoCertificadoGetByIdResponse = await this.eventServiceClient
      .send('tipo_certificado_get_by_id', {
        id: params.event_id,
        user: request.user
      })
      .toPromise()

    if (eventResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: eventResponse.message,
          data: null,
          errors: null
        },
        eventResponse.status
      )
    }

    const createCertificateResponse: IServiceCertificateCreateResponse = await this.certificateServiceClient
      .send('certificate_create', {
        activity,
        function: _function,
        participant: participantId,
        event: eventResponse.data.event.id,
        workload,
        start_date,
        end_date,
        authorship_order,
        additional_field
      })
      .toPromise()

    if (createCertificateResponse.status !== HttpStatus.CREATED) {
      throw new HttpException(
        {
          message: createCertificateResponse.message,
          data: null,
          errors: createCertificateResponse.errors
        },
        createCertificateResponse.status
      )
    }

    return {
      message: createCertificateResponse.message,
      data: {
        certificate: createCertificateResponse.certificate
      },
      errors: null
    }
  }

  @Patch([
    'events/:event_id/certificates/:id/download',
    'tipos-certificado/:event_id/certificates/:id/download'
  ])
  @Authorization(true)
  @Permission('certificate_mark_downloaded')
  @ApiOkResponse({
    type: CreateCertificateResponseDto
  })
  public async markCertificateAsDownloaded(
    @Req() request: IAuthorizedRequest,
    @Param() params: CertificateIdDto,
    @Body() body: MarkCertificateDownloadedDto
  ): Promise<CreateCertificateResponseDto> {
    const eventResponse: IServiceTipoCertificadoGetByIdResponse = await this.eventServiceClient
      .send('tipo_certificado_get_by_id', {
        id: params.event_id,
        user: request.user
      })
      .toPromise()

    if (eventResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: eventResponse.message,
          data: null,
          errors: null
        },
        eventResponse.status
      )
    }

    const markResponse: IServiceCertificateMarkDownloadedResponse = await this.certificateServiceClient
      .send('certificate_mark_downloaded', {
        id: params.id,
        event: eventResponse.data.event.id,
        model_id: body.model_id
      })
      .toPromise()

    if (markResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: markResponse.message,
          data: null,
          errors: markResponse.errors
        },
        markResponse.status
      )
    }

    return {
      message: markResponse.message,
      data: {
        certificate: markResponse.certificate
      },
      errors: null
    }
  }

  @Delete([
    'events/:event_id/certificates/:id',
    'tipos-certificado/:event_id/certificates/:id'
  ])
  @Authorization(true)
  @Permission('certificate_delete_by_id')
  @ApiOkResponse({
    type: DeleteCertificateResponseDto
  })
  public async deleteCertificate(
    // @Req() request: IAuthorizedRequest,
    @Param() params: CertificateIdDto
  ): Promise<DeleteCertificateResponseDto> {
    // const userInfo = request.user

    const deleteCertificateResponse: IServiceCertificateDeleteResponse = await this.certificateServiceClient
      .send('certificate_delete_by_id', {
        id: params.id
      })
      .toPromise()

    if (deleteCertificateResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: deleteCertificateResponse.message,
          errors: deleteCertificateResponse.errors,
          data: null
        },
        deleteCertificateResponse.status
      )
    }

    return {
      message: deleteCertificateResponse.message,
      data: null,
      errors: null
    }
  }
}
