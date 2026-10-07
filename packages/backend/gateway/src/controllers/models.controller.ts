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
import { IServiceTipoCertificadoGetByIdResponse } from '../interfaces/tipo-certificado/service-tipo-certificado-get-by-id-response.interface'
import { CreateModelResponseDto } from '../interfaces/model/dto/create-model-response.dto'
import { CreateModelDto } from '../interfaces/model/dto/create-model.dto'
import { DeleteModelResponseDto } from '../interfaces/model/dto/delete-model-response.dto'
import { ListModelResponseDto } from '../interfaces/model/dto/list-model-response.dto'
import { ListModelDto } from '../interfaces/model/dto/list-model.dto'
import { ModelIdDto } from '../interfaces/model/dto/model-id.dto'
import { UpdateModelResponseDto } from '../interfaces/model/dto/update-model-response.dto'
import { IServiceModelCreateResponse } from '../interfaces/model/service-model-create-response.interface'
import { IServiceModelDeleteResponse } from '../interfaces/model/service-model-delete-response.interface'
import { IServiceModelListResponse } from '../interfaces/model/service-model-list-response.interface'
import { IServiceModelUpdateResponse } from '../interfaces/model/service-model-update-response.interface'

@Controller(['events/:event_id/models', 'tipos-certificado/:event_id/models'])
@ApiBearerAuth('JWT')
@ApiTags('models')
export class ModelsController {
  constructor(
    @Inject('CERTIFICATE_SERVICE')
    private readonly certificateServiceClient: ClientProxy,
    @Inject('TIPO_CERTIFICADO_SERVICE')
    private readonly eventServiceClient: ClientProxy
  ) { }

  @Get()
  @Authorization(true)
  @Permission('model_list')
  @ApiOkResponse({
    type: ListModelResponseDto,
    description: 'List of models'
  })
  public async getModels(
    @Req() request: IAuthorizedRequest,
    @Param() params: ModelIdDto,
    @Res({ passthrough: true }) res: Response,
    @Query() query: ListModelDto
  ): Promise<ListModelResponseDto> {
    const { page = 1, per_page = 10, sort_by, order_by } = query

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

    const modelsResponse: IServiceModelListResponse = await this.certificateServiceClient
      .send('model_list', {
        event: eventResponse.data.event.id,
        page: Number(page),
        perPage: Number(per_page),
        sortBy: sort_by,
        orderBy: order_by
      })
      .toPromise()

    res.header('x-total-count', String(modelsResponse?.data.totalCount))
    res.header('x-total-page', String(modelsResponse?.data.totalPages))

    return {
      message: modelsResponse.message,
      data: modelsResponse?.data?.models
    }
  }

  @Post()
  @Authorization(true)
  @Permission('model_create')
  @ApiCreatedResponse({
    type: CreateModelResponseDto
  })
  public async createModel(
    @Req() request: IAuthorizedRequest,
    @Param() params: ModelIdDto,
    @Body() certificateRequest: CreateModelDto
  ): Promise<CreateModelResponseDto> {
    const { name, pages, criterions, is_default } = certificateRequest

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

    const createModelResponse: IServiceModelCreateResponse = await this.certificateServiceClient
      .send('model_create', {
        event: eventResponse.data.event.id,
        name,
        pages,
        criterions,
        is_default
      })
      .toPromise()

    if (createModelResponse.status !== HttpStatus.CREATED) {
      throw new HttpException(
        {
          message: createModelResponse.message,
          data: null,
          errors: createModelResponse.errors
        },
        createModelResponse.status
      )
    }

    return {
      message: createModelResponse.message,
      data: {
        model: createModelResponse.model
      },
      errors: null
    }
  }

  @Put(':id')
  @Authorization(true)
  @Permission('model_update')
  @ApiOkResponse({
    type: UpdateModelResponseDto
  })
  public async updateModel(
    @Req() request: IAuthorizedRequest,
    @Param() params: ModelIdDto,
    @Body() certificateRequest: CreateModelDto
  ): Promise<UpdateModelResponseDto> {
    const { name, pages, criterions, is_default } = certificateRequest

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

    const updateModelResponse: IServiceModelUpdateResponse = await this.certificateServiceClient
      .send('model_update', {
        id: params.id,
        event: eventResponse.data.event.id,
        model: {
          name,
          pages,
          criterions,
          is_default
        }
      })
      .toPromise()

    if (updateModelResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: updateModelResponse.message,
          data: null,
          errors: updateModelResponse.errors
        },
        updateModelResponse.status
      )
    }

    return {
      message: updateModelResponse.message,
      data: {
        model: updateModelResponse.model
      },
      errors: null
    }
  }

  @Delete(':id')
  @Authorization(true)
  @Permission('model_delete_by_id')
  @ApiOkResponse({
    type: DeleteModelResponseDto
  })
  public async deleteModel(
    @Param() params: ModelIdDto
  ): Promise<DeleteModelResponseDto> {
    const deleteModelResponse: IServiceModelDeleteResponse = await this.certificateServiceClient
      .send('model_delete_by_id', {
        id: params.id
      })
      .toPromise()

    if (deleteModelResponse.status !== HttpStatus.OK) {
      throw new HttpException(
        {
          message: deleteModelResponse.message,
          errors: deleteModelResponse.errors,
          data: null
        },
        deleteModelResponse.status
      )
    }

    return {
      message: deleteModelResponse.message,
      data: null,
      errors: null
    }
  }
}
