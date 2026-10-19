import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags
} from '@nestjs/swagger'
import { Response } from 'express'

import { Authorization } from '../decorators/authorization.decorator'
import { Permission } from '../decorators/permission.decorator'
import { IAuthorizedRequest } from '../interfaces/common/authorized-request.interface'
import { CreateTipoCertificadoResponseDto } from '../interfaces/tipo-certificado/dto/create-tipo-certificado-response.dto'
import { CreateTipoCertificadoDto } from '../interfaces/tipo-certificado/dto/create-tipo-certificado.dto'
import { DeleteTipoCertificadoResponseDto } from '../interfaces/tipo-certificado/dto/delete-tipo-certificado-response.dto'
import { TipoCertificadoIdDto } from '../interfaces/tipo-certificado/dto/tipo-certificado-id.dto'
import { GetTipoCertificadoByIdResponseDto } from '../interfaces/tipo-certificado/dto/get-tipo-certificado-by-id-response.dto'
import { GetTiposCertificadoResponseDto } from '../interfaces/tipo-certificado/dto/get-tipos-certificado-response.dto'
import { ListTipoCertificadoDto } from '../interfaces/tipo-certificado/dto/list-tipo-certificado.dto'
import { UpdateTipoCertificadoResponseDto } from '../interfaces/tipo-certificado/dto/update-tipo-certificado-response.dto'
import { UpdateTipoCertificadoDto } from '../interfaces/tipo-certificado/dto/update-tipo-certificado.dto'
import { IServiceTipoCertificadoCreateResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-create-response.interface'
import { IServiceTipoCertificadoDeleteResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-delete-response.interface'
import { IServiceTipoCertificadoGetByIdResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-get-by-id-response.interface'
import { IServiceTipoCertificadoListResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-list-response.interface'
import { IServiceTipoCertificadoPublishByIdResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-publish-by-id-response.interface'
import { IServiceTipoCertificadoUpdateByIdResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-update-by-id-response.interface'

@Controller('tipos-certificado')
@ApiBearerAuth('JWT')
@ApiTags('tipos-certificado')
export class TiposCertificadoController {
  constructor(
    @Inject('TIPO_CERTIFICADO_SERVICE') private readonly eventServiceClient: ClientProxy,
    @Inject('CERTIFICATE_SERVICE') private readonly certificateServiceClient: ClientProxy,
    @Inject('MAILER_SERVICE') private readonly mailerServiceClient: ClientProxy
  ) { }

  @Get(':id')
  @Authorization(true)
  @Permission('tipo_certificado_get_by_id')
  @ApiOkResponse({
    type: GetTipoCertificadoByIdResponseDto,
    description: 'Find event by id'
  })
  public async getEventById(
    @Req() request: IAuthorizedRequest,
    @Param() params: TipoCertificadoIdDto
  ): Promise<GetTipoCertificadoByIdResponseDto> {
    const { id } = params

    const eventResponse: IServiceTipoCertificadoGetByIdResponse = await this.eventServiceClient
      .send('tipo_certificado_get_by_id', { id, user: request?.user })
      .toPromise()

    return {
      message: eventResponse.message,
      data: eventResponse?.data?.event
    }
  }

  @Get()
  @Authorization(true)
  @Permission('tipo_certificado_list')
  @ApiOkResponse({
    type: GetTiposCertificadoResponseDto,
    description: 'List of events'
  })
  public async getEvents(
    @Req() request: IAuthorizedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query() query: ListTipoCertificadoDto
  ): Promise<GetTiposCertificadoResponseDto> {
    const { search, page, per_page, sort_by, order_by, status } = query
    const eventsResponse: IServiceTipoCertificadoListResponse = await this.eventServiceClient
      .send('tipo_certificado_list', {
        name: search,
        user: request.user,
        page: Number(page),
        perPage: Number(per_page),
        sortBy: sort_by,
        orderBy: order_by,
        status
      })
      .toPromise()

    res.header('x-total-count', String(eventsResponse?.data.totalCount))
    res.header('x-total-page', String(eventsResponse?.data.totalPages))

    return {
      message: eventsResponse.message,
      data: eventsResponse?.data?.events
    }
  }

  @Post()
  @Authorization(true)
  @Permission('tipo_certificado_create')
  @ApiCreatedResponse({
    type: CreateTipoCertificadoResponseDto
  })
  public async createEvent(
    @Body() eventRequest: CreateTipoCertificadoDto
  ): Promise<CreateTipoCertificadoResponseDto> {
    const createEventResponse: IServiceTipoCertificadoCreateResponse = await this.eventServiceClient
      .send(
        'tipo_certificado_create',
        Object.assign(eventRequest, {
          year: new Date(eventRequest.start_date).getFullYear()
        })
      )
      .toPromise()

    if (createEventResponse.status !== HttpStatus.CREATED) {
      throw new HttpException(
        {
          message: createEventResponse.message,
          data: null,
          errors: createEventResponse.errors
        },
        createEventResponse.status
      )
    }

    return {
      message: createEventResponse.message,
      data: {
        event: createEventResponse.event
      },
      errors: null
    }
  }

  @Delete(':id')
  @Authorization(true)
  @Permission('tipo_certificado_delete_by_id')
  @ApiOkResponse({
    type: DeleteTipoCertificadoResponseDto
  })
  public async deleteEvent(
    @Req() request: IAuthorizedRequest,
    @Param() params: TipoCertificadoIdDto
  ): Promise<DeleteTipoCertificadoResponseDto> {
    const userInfo = request.user

    const deleteEventResponse: IServiceTipoCertificadoDeleteResponse = await this.eventServiceClient
      .send('tipo_certificado_delete_by_id', {
        id: params.id,
        user: userInfo
      })
      .toPromise()

    if (deleteEventResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: deleteEventResponse.message,
          errors: deleteEventResponse.errors,
          data: null
        },
        deleteEventResponse.status
      )
    }

    return {
      message: deleteEventResponse.message,
      data: null,
      errors: null
    }
  }

  @Put(':id')
  @Authorization(true)
  @Permission('tipo_certificado_update_by_id')
  @ApiOkResponse({
    type: UpdateTipoCertificadoResponseDto
  })
  public async updateEvent(
    @Req() request: IAuthorizedRequest,
    @Param() params: TipoCertificadoIdDto,
    @Body() eventRequest: UpdateTipoCertificadoDto
  ): Promise<UpdateTipoCertificadoResponseDto> {
    const userInfo = request.user
    const updateEventResponse: IServiceTipoCertificadoUpdateByIdResponse = await this.eventServiceClient
      .send('tipo_certificado_update_by_id', {
        id: params.id,
        user: userInfo,
        event: eventRequest
      })
      .toPromise()

    if (updateEventResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: updateEventResponse.message,
          errors: updateEventResponse.errors,
          data: null
        },
        updateEventResponse.status
      )
    }

    return {
      message: updateEventResponse.message,
      data: {
        event: updateEventResponse.event
      },
      errors: null
    }
  }

  @Post(':id/publish')
  @Authorization(true)
  @Permission('tipo_certificado_publish_by_id')
  public async publishEvent(
    @Req() request: IAuthorizedRequest,
    @Param() params: TipoCertificadoIdDto
  ): Promise<{ message: string; data: { event: any } | null; errors: any }> {
    const publishResponse: IServiceTipoCertificadoPublishByIdResponse = await this.eventServiceClient
      .send('tipo_certificado_publish_by_id', { id: params.id, user: request.user })
      .toPromise()

    if (publishResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: publishResponse.message,
          data: null,
          errors: publishResponse.errors
        },
        publishResponse.status
      )
    }

    // Enviar e-mail para todos os participantes do evento
    try {
      const event = publishResponse.event
      const site = process.env.WEB_URL || 'http://certificados.conquista.ifba.edu.br'
      const formatDate = (d: Date | string): string => {
        const date = new Date(d)
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })
      }

      const certResponse = await this.certificateServiceClient
        .send('certificate_list', {
          event: params.id,
          page: 1,
          perPage: 10000,
          sortBy: 'created_at',
          orderBy: 'ASC'
        })
        .toPromise()

      if (certResponse?.data?.certificates?.length) {
        const seen = new Set<string>()
        for (const cert of certResponse.data.certificates) {
          const participant = cert.participant
          if (!participant?.email) continue
          if (seen.has(participant.email)) continue
          seen.add(participant.email)

          this.mailerServiceClient
            .send('mail_send', {
              to: participant.email,
              subject: `Certificados disponíveis — ${event.name}`,
              template: '/templates/certificate_available',
              context: {
                name: participant.name,
                event_name: event.name,
                start_date: formatDate(event.start_date),
                end_date: formatDate(event.end_date),
                site,
                email: participant.email
              }
            })
            .toPromise()
            .catch(err => console.error(`Erro ao enviar e-mail para ${participant.email}:`, err))
        }
      }
    } catch (err) {
      console.error('Erro ao enviar e-mails de certificados disponíveis:', err)
    }

    return {
      message: publishResponse.message,
      data: { event: publishResponse.event },
      errors: null
    }
  }
}
