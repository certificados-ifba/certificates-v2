import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

import { IModelListParams } from '../interfaces/model-list-params.interface'
import { ModelDataResponse } from '../interfaces/model-list-response.interface'
import { IModel } from '../interfaces/model.interface'

@Injectable()
export class ModelService {
  constructor(
    @InjectModel('Model')
    private readonly ModelModel: Model<IModel>,
    @InjectModel('Activity')
    private readonly ActivityModel: Model<any>
  ) { }

  public async createModel(modelBody: IModel): Promise<IModel> {
    const ModelModel = new this.ModelModel(modelBody)
    return await ModelModel.save()
  }

  public async findModelById(id: string): Promise<IModel> {
    return await this.ModelModel.findById(id)
      .populate({ path: 'criterions.activity', populate: { path: 'type' } })
  }

  public async updateModelById(id: string, modelBody: Partial<IModel>): Promise<IModel> {
    return await this.ModelModel.findByIdAndUpdate(id, modelBody, { new: true })
      .populate({ path: 'criterions.activity', populate: { path: 'type' } })
  }

  // Cada atividade só pode ser critério de um modelo do evento. Devolve as
  // atividades informadas que já pertencem a outro modelo (exceto exceptModelId).
  public async findCriterionConflicts(
    event: string,
    activityIds: string[],
    exceptModelId?: string
  ): Promise<Array<{ activity: string; model: string }>> {
    if (activityIds.length === 0) return []

    const query: any = {
      event: new Types.ObjectId(event),
      'criterions.activity': { $in: activityIds.map(id => new Types.ObjectId(id)) }
    }
    if (exceptModelId) query._id = { $ne: new Types.ObjectId(exceptModelId) }

    // Compara pelos ids gravados (sem populate): atividade apagada também conta
    const models = await this.ModelModel.find(query).lean()
    const conflicts = models.flatMap(model =>
      (model.criterions || [])
        .filter(criterion => activityIds.includes(String(criterion.activity)))
        .map(criterion => ({ activityId: String(criterion.activity), model: model.name }))
    )

    const activities = await this.ActivityModel.find(
      { _id: { $in: conflicts.map(conflict => new Types.ObjectId(conflict.activityId)) } },
      'name'
    ).lean()
    const activityNames = new Map(activities.map(activity => [String(activity._id), activity.name]))

    return conflicts.map(conflict => ({
      activity: activityNames.get(conflict.activityId) || conflict.activityId,
      model: conflict.model
    }))
  }

  public async removeModelById(id: string): Promise<IModel> {
    return await this.ModelModel.findOneAndDelete({ _id: id })
  }

  public async listModels({
    event,
    page = 1,
    perPage = 10,
    sortBy = 'created_at',
    orderBy = 'ASC'
  }: IModelListParams): Promise<ModelDataResponse> {
    const query = {
      event: new Types.ObjectId(event)
    }

    const sort = { [sortBy]: orderBy }

    const models = await this.ModelModel.find(query)
      .populate({ path: 'criterions.activity', populate: { path: 'type' } })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .sort(sort)
      .exec()

    const count = await this.ModelModel.countDocuments(query)

    return {
      models,
      totalPages: Math.ceil(count / perPage),
      totalCount: count
    }
  }
}
