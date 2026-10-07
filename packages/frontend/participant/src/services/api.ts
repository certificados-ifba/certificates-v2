import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.baseURL
})

export const storageUrl = (file: string): string =>
  `${process.env.baseURL}/upload/${file}`

export const errorMessage = (err: any, fallback: string): string => {
  const message = err?.response?.data?.message
  return typeof message === 'string' ? message : fallback
}
