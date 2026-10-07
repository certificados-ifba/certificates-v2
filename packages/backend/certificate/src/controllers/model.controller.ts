import { Controller, HttpStatus } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'

import { ICertificateParticipantModelResponse } from '../interfaces/certificate-participant-model-response.interface'
import { IModelByIdResponse } from '../interfaces/model-by-id-response.interface'
import { IModelCreateResponse } from '../interfaces/model-create-response.interface'
import { IModelDeleteResponse } from '../interfaces/model-delete-response.interface'
import { IModelListParams } from '../interfaces/model-list-params.interface'
import { IModelListResponse } from '../interfaces/model-list-response.interface'
import { IModelUpdateResponse } from '../interfaces/model-update-response.interface'
import { IModel } from '../interfaces/model.interface'
import { CertificateService } from '../services/certificate.service'
import { ModelService } from '../services/model.service'

@Controller()
export class ModelController {
  constructor(
    private readonly modelService: ModelService,
    private readonly certificateService: CertificateService
  ) { }

  @MessagePattern('certificate_participant_model')
  public async certificateParticipantModel(params: {
    id: string
    user: string
  }): Promise<ICertificateParticipantModelResponse> {
    if (!params?.id || !params?.user) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'certificate_participant_model_bad_request',
        data: null
      }
    }

    const certificate = await this.certificateService.findCertificateWithActivity(
      params.id
    )

    if (!certificate || String(certificate.participant) !== params.user) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'certificate_participant_model_not_found',
        data: null
      }
    }

    const model = await this.modelService.findModelForCertificate(
      String(certificate.event),
      String(certificate.activity?.type),
      String(certificate.function)
    )

    if (!model) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'certificate_participant_model_without_model',
        data: null
      }
    }

    return {
      status: HttpStatus.OK,
      message: 'certificate_participant_model_success',
      data: { model }
    }
  }

  @MessagePattern('model_list')
  public async modelList(
    params: IModelListParams
  ): Promise<IModelListResponse> {
    const models = await this.modelService.listModels(params)

    return {
      status: HttpStatus.OK,
      message: 'model_list_success',
      data: models
    }
  }

  @MessagePattern('model_get_by_id')
  public async getModelById(params: {
    id: string
  }): Promise<IModelByIdResponse> {
    let result: IModelByIdResponse

    if (params?.id) {
      const model = await this.modelService.findModelById(params.id)
      if (model) {
        result = {
          status: HttpStatus.OK,
          message: 'model_get_by_id_success',
          data: { model }
        }
      } else {
        result = {
          status: HttpStatus.NOT_FOUND,
          message: 'model_get_by_id_not_found',
          data: null
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'model_get_by_id_bad_request',
        data: null
      }
    }

    return result
  }

  @MessagePattern('model_create')
  public async modelCreate(modelBody: IModel): Promise<IModelCreateResponse> {
    let result: IModelCreateResponse

    if (modelBody) {
      try {
        modelBody.criterions = this.uniqueCriterions(modelBody.criterions)
        const conflicts = await this.modelService.findCriterionConflicts(
          String(modelBody.event),
          this.criterionActivityIds(modelBody.criterions)
        )
        if (conflicts.length > 0) {
          return {
            status: HttpStatus.CONFLICT,
            message: 'model_create_conflict_activity',
            model: null,
            errors: { conflicts }
          }
        }

        const model = await this.modelService.createModel(modelBody)
        result = {
          status: HttpStatus.CREATED,
          message: 'model_create_success',
          model,
          errors: null
        }
      } catch (e) {
        result = {
          status: HttpStatus.PRECONDITION_FAILED,
          message: 'model_create_precondition_failed',
          model: null,
          errors: e.errors
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'model_create_bad_request',
        model: null,
        errors: null
      }
    }

    return result
  }

  @MessagePattern('model_update')
  public async modelUpdate(params: {
    id: string
    event: string
    model: Partial<import('../interfaces/model.interface').IModel>
  }): Promise<IModelUpdateResponse> {
    let result: IModelUpdateResponse

    if (params?.id && params?.model) {
      try {
        const found = await this.modelService.findModelById(params.id)
        // Só atualiza modelo do evento informado (o dono foi conferido no gateway)
        const current = found && String(found.event) === String(params.event) ? found : null
        if (current && params.model.criterions) {
          params.model.criterions = this.uniqueCriterions(params.model.criterions)
          const conflicts = await this.modelService.findCriterionConflicts(
            String(current.event),
            this.criterionActivityIds(params.model.criterions),
            params.id
          )
          if (conflicts.length > 0) {
            return {
              status: HttpStatus.CONFLICT,
              message: 'model_update_conflict_activity',
              model: null,
              errors: { conflicts }
            }
          }
        }

        const model = current
          ? await this.modelService.updateModelById(params.id, params.model)
          : null
        if (model) {
          result = {
            status: HttpStatus.OK,
            message: 'model_update_success',
            model,
            errors: null
          }
        } else {
          result = {
            status: HttpStatus.NOT_FOUND,
            message: 'model_update_not_found',
            model: null,
            errors: null
          }
        }
      } catch (e) {
        result = {
          status: HttpStatus.PRECONDITION_FAILED,
          message: 'model_update_precondition_failed',
          model: null,
          errors: e.errors
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'model_update_bad_request',
        model: null,
        errors: null
      }
    }

    return result
  }

  @MessagePattern('model_delete_by_id')
  public async modelDeleteForUser(params: {
    id: string
  }): Promise<IModelDeleteResponse> {
    let result: IModelDeleteResponse

    if (params && params.id) {
      try {
        const model = await this.modelService.findModelById(params.id)

        if (model) {
          await this.modelService.removeModelById(params.id)
          result = {
            status: HttpStatus.OK,
            message: 'model_delete_by_id_success',
            errors: null
          }
        } else {
          result = {
            status: HttpStatus.NOT_FOUND,
            message: 'model_delete_by_id_not_found',
            errors: null
          }
        }
      } catch (e) {
        result = {
          status: HttpStatus.FORBIDDEN,
          message: 'model_delete_by_id_forbidden',
          errors: null
        }
      }
    } else {
      result = {
        status: HttpStatus.BAD_REQUEST,
        message: 'model_delete_by_id_bad_request',
        errors: null
      }
    }

    return result
  }

  // O mesmo critério repetido no próprio modelo não muda nada: mantém um só.
  // Critério antigo (sem atividade) é identificado por tipo + função.
  private uniqueCriterions<T extends { activity?: any; function?: any; type_activity?: any }>(
    criterions?: T[]
  ): T[] {
    const seen = new Set<string>()
    return (criterions || []).filter(criterion => {
      const key = criterion?.activity
        ? String(criterion.activity)
        : `${criterion?.type_activity}|${criterion?.function}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // A regra "uma atividade por modelo" só vale para critérios por atividade.
  private criterionActivityIds(criterions: Array<{ activity?: any }>): string[] {
    return criterions
      .filter(criterion => criterion.activity)
      .map(criterion => String(criterion.activity))
  }
}
