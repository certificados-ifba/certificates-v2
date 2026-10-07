import { Document, Types } from 'mongoose'

interface ILayout {
  orientation?: string
  padding: string
  horizontal_padding: number
  vertical_padding: number
  position: string
  horizontal_position: number
  vertical_position: number
}

interface IPage {
  type: string
  text: string
  image: string
  layout: ILayout
}

interface ICriterion {
  activity?: Types.ObjectId
  // Formato antigo (tipo de atividade + função)
  function?: Types.ObjectId
  type_activity?: Types.ObjectId
}

export interface IModel extends Document {
  event: Types.ObjectId
  name: string
  pages: IPage[]
  criterions: ICriterion[]
  is_default: boolean
  created_at: number
  updated_at: number
}
