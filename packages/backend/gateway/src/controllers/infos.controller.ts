import {
  Controller,
  Get,
  Req,
  Res,
  Inject,
  Query,
  Param,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { ApiTags, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'

import { Authorization } from '../decorators/authorization.decorator'
import { Permission } from '../decorators/permission.decorator'
import { ListCertificateResponseDto } from '../interfaces/certificate/dto/list-certificate-response.dto'
import { ListCertificateDto } from '../interfaces/certificate/dto/list-certificate.dto'
import { IServiceCertificateParticipantModelResponse } from '../interfaces/certificate/service-certificate-participant-model-response.interface'
import { IServiceCertificateListResponse } from '../interfaces/certificate/service-certificate-list-response.interface'
import { IAuthorizedRequest } from '../interfaces/common/authorized-request.interface'
import { GetUserByTokenResponseDto } from '../interfaces/user/dto/get-user-by-token-response.dto'
import { IServiceUserGetByIdResponse } from '../interfaces/user/service-user-get-by-id-response.interface'

@Controller('me')
@ApiBearerAuth('JWT')
@ApiTags('infos')
export class InfosController {
  constructor(
    @Inject('CERTIFICATE_SERVICE')
    private readonly certificateServiceClient: ClientProxy,
    @Inject('USER_SERVICE')
    private readonly userServiceClient: ClientProxy
  ) {}

  @Get()
  @Authorization(true)
  @Permission('user_get_by_id')
  @ApiOkResponse({
    type: GetUserByTokenResponseDto
  })
  public async getUserByToken(
    @Req() request: IAuthorizedRequest
  ): Promise<GetUserByTokenResponseDto> {
    const userInfo = request.user

    const userResponse: IServiceUserGetByIdResponse = await this.userServiceClient
      .send('user_get_by_id', userInfo.id)
      .toPromise()

    return {
      message: userResponse.message,
      data: {
        user: userResponse.data.user
      },
      errors: null
    }
  }

  @Get('certificates')
  @Authorization(true)
  @Permission('certificate_list')
  @ApiOkResponse({
    type: ListCertificateResponseDto,
    description: 'List of certificates'
  })
  public async getCertificates(
    @Req() request: IAuthorizedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query() query: ListCertificateDto
  ): Promise<ListCertificateResponseDto> {
    const { search, event, page, per_page, sort_by, order_by } = query
    const userInfo = request.user

    const certificatesResponse: IServiceCertificateListResponse = await this.certificateServiceClient
      .send('certificate_list', {
        name: search,
        user: userInfo.id,
        event: event,
        onlyPublished: true,
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

  @Get('certificates/:id/model')
  @Authorization(true)
  @Permission('certificate_download')
  public async getCertificateModel(
    @Req() request: IAuthorizedRequest,
    @Param('id') id: string
  ): Promise<IServiceCertificateParticipantModelResponse> {
    const modelResponse: IServiceCertificateParticipantModelResponse = await this.certificateServiceClient
      .send('certificate_participant_model', {
        id,
        user: request.user.id
      })
      .toPromise()

    if (modelResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: modelResponse.message,
          data: null,
          errors: null
        },
        modelResponse.status
      )
    }

    return {
      message: modelResponse.message,
      data: modelResponse.data
    }
  }
}
