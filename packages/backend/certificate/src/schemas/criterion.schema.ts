import { Schema } from 'mongoose'

// Critério novo: uma atividade do evento. Formato antigo (2021): tipo de
// atividade + função. Os dois convivem para não quebrar modelos já gravados.
export const CriterionSchema = new Schema({
  activity: {
    type: Schema.Types.ObjectId,
    ref: 'Activity'
  },
  function: {
    type: Schema.Types.ObjectId,
    ref: 'Generic'
  },
  type_activity: {
    type: Schema.Types.ObjectId,
    ref: 'Generic'
  }
})

CriterionSchema.pre('validate', function (next) {
  const criterion = this as any
  if (!criterion.activity && !(criterion.function && criterion.type_activity)) {
    criterion.invalidate('activity', 'Activity can not be empty')
  }
  next()
})
