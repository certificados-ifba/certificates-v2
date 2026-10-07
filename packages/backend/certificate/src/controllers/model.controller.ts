import { Controller, HttpStatus } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'

import { IModelByIdResponse } from '../interfaces/model-by-id-response.interface'
import { IModelCreateResponse } from '../interfaces/model-create-response.interface'
import { IModelDeleteResponse } from '../interfaces/model-delete-response.interface'
import { IModelListParams } from '../interfaces/model-list-params.interface'
import { IModelListResponse } from '../interfaces/model-list-response.interface'
import { IModelUpdateResponse } from '../interfaces/model-update-response.interface'
import { IModel } from '../interfaces/model.interface'
import { ModelService } from '../services/model.service'

@Controller()
export class ModelController {
  constructor(private readonly modelService: ModelService) { }

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
          modelBody.criterions.map(criterion => String(criterion.activity))
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
            params.model.criterions.map(criterion => String(criterion.activity)),
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

  // A mesma atividade repetida no próprio modelo não muda nada: mantém uma só.
  private uniqueCriterions<T extends { activity: any }>(criterions?: T[]): T[] {
    const seen = new Set<string>()
    return (criterions || []).filter(criterion => {
      const activityId = String(criterion?.activity)
      if (seen.has(activityId)) return false
      seen.add(activityId)
      return true
    })
  }
}
