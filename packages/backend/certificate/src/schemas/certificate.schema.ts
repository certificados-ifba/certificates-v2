import * as mongoose from 'mongoose'
import { v4 as uuid } from 'uuid'

function transformValue(doc, ret: { [key: string]: any }) {
  delete ret._id
  ret.start_date = ret.start_date.toISOString().substr(0, 10)
  ret.end_date = ret.end_date.toISOString().substr(0, 10)
}

export const CertificateSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity can not be empty']
    },
    function: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Generic',
      required: [true, 'Function can not be empty']
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant can not be empty']
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TipoCertificado',
      required: [true, 'TipoCertificado can not be empty']
    },
    key: {
      type: String,
      default: uuid()
    },
    workload: {
      type: Number,
      required: [true, 'Workload can not be empty']
    },
    start_date: {
      type: Date,
      required: [true, 'Start date can not be empty']
    },
    end_date: {
      type: Date,
      required: [true, 'End date can not be empty']
    },
    authorship_order: {
      type: String
    },
    additional_field: {
      type: String
    },
    downloads: {
      type: [
        {
          model: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Model'
          },
          downloaded_at: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: transformValue
    },
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: transformValue
    }
  }
)
