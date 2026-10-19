import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

import { ITipoCertificadoListParams } from '../interfaces/tipo-certificado-list-params.interface'
import { DataResponse } from '../interfaces/tipo-certificado-list-response.interface'
import { ITipoCertificadoUpdateParams } from '../interfaces/tipo-certificado-update-params.interface'
import { ITipoCertificado } from '../interfaces/tipo-certificado.interface'

@Injectable()
export class TipoCertificadoService {
  constructor(
    @InjectModel('TipoCertificado') private readonly TipoCertificadoModel: Model<ITipoCertificado> // private readonly TipoCertificadoModel = model('', )
  ) { }

  public async getEventsByUserId(userId: string): Promise<ITipoCertificado[]> {
    return this.TipoCertificadoModel.find({ user: userId })
  }

  public async searchEventById(id: string): Promise<ITipoCertificado> {
    return this.TipoCertificadoModel.findById(id).populate('user')
  }

  public async createEvent(eventBody: ITipoCertificado): Promise<ITipoCertificado> {
    const TipoCertificadoModel = new this.TipoCertificadoModel(eventBody)
    return TipoCertificadoModel.save()
  }

  public async findEventById(id: string): Promise<ITipoCertificado> {
    return this.TipoCertificadoModel.findById(id)
  }

  public async removeEventById(id: string): Promise<ITipoCertificado> {
    return this.TipoCertificadoModel.findOneAndDelete({ _id: id })
  }

  public async publishEventById(id: string): Promise<ITipoCertificado> {
    return this.TipoCertificadoModel.findOneAndUpdate(
      { _id: id },
      { status: 'PUBLISHED' },
      { new: true }
    ).populate('user')
  }

  public async updateEventById(
    id: string,
    params: ITipoCertificadoUpdateParams
  ): Promise<ITipoCertificado> {
    return this.TipoCertificadoModel.findOneAndUpdate({ _id: id }, params, {
      new: true
    }).populate('user')
  }

  public async listEvents({
    user,
    name,
    page,
    perPage,
    sortBy = 'created_at',
    orderBy = 'ASC',
    status
  }: ITipoCertificadoListParams): Promise<DataResponse> {
    const query: any = {}

    query.$or = [
      { name: new RegExp(name ? '.*' + name + '.*' : '.*', 'i') },
      { initials: new RegExp(name ? '.*' + name + '.*' : '.*', 'i') }
    ]

    if (['DRAFT', 'PUBLISHED', 'REVIEW'].includes(status)) query.status = status

    if (user.role !== 'ADMIN') query.user = new Types.ObjectId(user.id)

    const sort = JSON.parse(`{"${sortBy}":"${orderBy}"}`)

    const events = await this.TipoCertificadoModel.find(query)
      .populate('user')
      .skip(perPage * (page - 1))
      .limit(perPage)
      .sort(sort)
      .exec()

    const count = await this.TipoCertificadoModel.countDocuments(query)

    return {
      events,
      totalPages: Math.ceil(count / perPage),
      totalCount: count
    }
  }

  public async getEventPublished(): Promise<number> {
    return this.TipoCertificadoModel.countDocuments({
      status: 'PUBLISHED'
    })
  }
}
