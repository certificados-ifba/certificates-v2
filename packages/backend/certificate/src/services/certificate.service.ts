import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

import { ICertificateListParams } from '../interfaces/certificate-list-params.interface'
import { DataResponse } from '../interfaces/certificate-list-response.interface'
import { ICertificate } from '../interfaces/certificate.interface'
import { IActivity } from '../interfaces/activity.interface'
import { IGeneric } from '../interfaces/generic.interface'
import { IParticipant } from '../interfaces/participant.interface'

@Injectable()
export class CertificateService {
  constructor(
    @InjectModel('Certificate')
    private readonly CertificateModel: Model<ICertificate>,
    @InjectModel('Activity')
    private readonly ActivityModel: Model<IActivity>,
    @InjectModel('Generic')
    private readonly GenericModel: Model<IGeneric>,
    @InjectModel('User')
    private readonly UserModel: Model<IParticipant>
  ) {}

  private getEndOfDay(date: string): Date {
    const nextDate = new Date(date)
    nextDate.setHours(23, 59, 59, 999)
    return nextDate
  }

  private parseObjectIdList(value: string | string[]): Types.ObjectId[] {
    const values = Array.isArray(value) ? value : String(value).split(',')

    return values
      .map(item => String(item).trim())
      .filter(item => Types.ObjectId.isValid(item))
      .map(item => new Types.ObjectId(item))
  }

  public async createCertificate(
    certificateBody: ICertificate
  ): Promise<ICertificate> {
    const duplicateCertificate = await this.CertificateModel.findOne({
      participant: certificateBody.participant,
      event: certificateBody.event,
      activity: certificateBody.activity,
      function: certificateBody.function
    })

    if (duplicateCertificate) {
      throw new Error('certificate_create_conflict_same_function')
    }
    const existingCertificateInActivity = await this.CertificateModel.findOne({
      participant: certificateBody.participant,
      event: certificateBody.event,
      activity: certificateBody.activity,
      function: { $ne: certificateBody.function }
    })

    if (existingCertificateInActivity) {
      throw new Error('certificate_create_conflict_duplicate')
    }

    const CertificateModel = new this.CertificateModel(certificateBody)
    return await CertificateModel.save()
  }

  public async findCertificateById(id: string): Promise<ICertificate> {
    return await this.CertificateModel.findById(id)
  }

  public async findCertificateByKey(key: string): Promise<ICertificate> {
    return await this.CertificateModel.findOne({ key })
      .populate('function')
      .populate('activity')
      .populate('participant')
      .populate('event')
  }

  public async removeCertificateById(id: string): Promise<ICertificate> {
    return await this.CertificateModel.findOneAndDelete({ _id: id })
  }

  public async markCertificateAsDownloaded(id: string, modelId: string): Promise<ICertificate> {
    const certificate = await this.CertificateModel.findById(id)

    if (!certificate) return null

    certificate.downloads = (certificate.downloads || []).filter(
      download => String(download.model) !== String(modelId)
    )
    certificate.downloads.push({
      model: new Types.ObjectId(modelId),
      downloaded_at: new Date()
    })

    return await certificate.save()
  }

  public async listCertificates({
    user,
    event,
    name,
    activity,
    typeActivity,
    function: functionName,
    workloadMin,
    workloadMax,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    page = 1,
    perPage = 10,
    sortBy = 'created_at',
    orderBy = 'ASC'
  }: ICertificateListParams): Promise<DataResponse> {
    const matchStage: any = {}

    if (event) matchStage.event = new Types.ObjectId(event)
    if (user) matchStage.participant = new Types.ObjectId(user)
    if (name) {
      const formattedSearch = String(name).trim()
      const cpfSearch = formattedSearch.replace(/\D/g, '')
      const participants = await this.UserModel.find({
        $or: [
          { name: { $regex: formattedSearch, $options: 'i' } },
          ...(cpfSearch
            ? [{ 'personal_data.cpf': { $regex: cpfSearch, $options: 'i' } }]
            : [])
        ]
      })
        .select('_id')
        .lean()
      const participantIds = participants.map(
        ({ _id }) => new Types.ObjectId(_id)
      )

      if (matchStage.participant) {
        const fixedParticipant = matchStage.participant
        matchStage.participant = {
          $in: participantIds.filter(
            participantId => String(participantId) === String(fixedParticipant)
          )
        }
      } else {
        matchStage.participant = {
          $in: participantIds
        }
      }
    }
    if (activity) {
      const ids = this.parseObjectIdList(activity)
      if (ids.length > 0) {
        matchStage.activity = { $in: ids }
      } else {
        const activities = await this.ActivityModel.find({
          name: { $regex: String(activity).trim(), $options: 'i' }
        })
          .select('_id')
          .lean()
        matchStage.activity = {
          $in: activities.map(({ _id }) => new Types.ObjectId(_id))
        }
      }
    }
    if (typeActivity) {
      const types = await this.GenericModel.find({
        name: { $regex: String(typeActivity).trim(), $options: 'i' }
      })
        .select('_id')
        .lean()
      const typeIds = types.map(({ _id }) => new Types.ObjectId(_id))
      const activities = await this.ActivityModel.find({
        type: { $in: typeIds }
      })
        .select('_id')
        .lean()
      const activityIds = activities.map(({ _id }) => new Types.ObjectId(_id))
      if (matchStage.activity) {
        const existing = matchStage.activity.$in as Types.ObjectId[]
        matchStage.activity.$in = existing.filter(id =>
          activityIds.some(aid => String(aid) === String(id))
        )
      } else {
        matchStage.activity = { $in: activityIds }
      }
    }
    if (functionName) {
      const functions = await this.GenericModel.find({
        name: { $regex: String(functionName).trim(), $options: 'i' }
      })
        .select('_id')
        .lean()
      matchStage.function = {
        $in: functions.map(({ _id }) => new Types.ObjectId(_id))
      }
    }
    if (workloadMin || workloadMax) {
      matchStage.workload = {}
      if (workloadMin) matchStage.workload.$gte = Number(workloadMin)
      if (workloadMax) matchStage.workload.$lte = Number(workloadMax)
    }
    if (startDateFrom || startDateTo) {
      matchStage.start_date = {}
      if (startDateFrom) matchStage.start_date.$gte = new Date(startDateFrom)
      if (startDateTo)
        matchStage.start_date.$lte = this.getEndOfDay(startDateTo)
    }
    if (endDateFrom || endDateTo) {
      matchStage.end_date = {}
      if (endDateFrom) matchStage.end_date.$gte = new Date(endDateFrom)
      if (endDateTo) matchStage.end_date.$lte = this.getEndOfDay(endDateTo)
    }

    const sortOrder = orderBy === 'DESC' ? -1 : 1

    let certificates: any[]
    let count: number

    if (sortBy === 'participant_name') {
      const pipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'participant',
            foreignField: '_id',
            as: '_participant'
          }
        },
        {
          $addFields: {
            _participantName: {
              $toLower: { $arrayElemAt: ['$_participant.name', 0] }
            }
          }
        },
        { $sort: { _participantName: sortOrder } },
        { $skip: perPage * (page - 1) },
        { $limit: perPage },
        {
          $project: {
            _participant: 0,
            _participantName: 0
          }
        }
      ]

      const countPipeline: any[] = [
        { $match: matchStage },
        { $count: 'total' }
      ]

      const [results, countResult] = await Promise.all([
        this.CertificateModel.aggregate(pipeline).exec(),
        this.CertificateModel.aggregate(countPipeline).exec()
      ])

      certificates = await this.CertificateModel.populate(results, [
        { path: 'function' },
        { path: 'activity', populate: { path: 'type' } },
        { path: user ? 'event' : 'participant' }
      ])

      count = countResult[0]?.total ?? 0
    } else {
      const sort = JSON.parse(`{"${sortBy}":"${orderBy}"}`)

      ;[certificates, count] = await Promise.all([
        this.CertificateModel.find(matchStage)
          .populate('function')
          .populate({ path: 'activity', populate: { path: 'type' } })
          .populate(user ? 'event' : 'participant')
          .skip(perPage * (page - 1))
          .limit(perPage)
          .sort(sort)
          .exec(),
        this.CertificateModel.countDocuments(matchStage)
      ])
    }

    return {
      certificates,
      totalPages: Math.ceil(count / perPage),
      totalCount: count
    }
  }

  public async findGenericById(id: string): Promise<IGeneric> {
    return this.GenericModel.findById(id).exec()
  }

  public async getCertificateIssued(): Promise<number> {
    const certificates = await this.CertificateModel.aggregate()
      .lookup({
        from: 'events',
        localField: 'event',
        foreignField: '_id',
        as: 'event'
      })
      .match({ 'event.status': 'PUBLISHED' })
    return certificates?.length
  }
}
