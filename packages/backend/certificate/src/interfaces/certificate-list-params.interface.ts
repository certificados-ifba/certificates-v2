export interface ICertificateListParams {
  event?: string
  user?: string
  // Só certificados de eventos publicados (listagem do próprio participante)
  onlyPublished?: boolean
  name?: string
  activity?: string | string[]
  typeActivity?: string
  function?: string
  workloadMin?: string
  workloadMax?: string
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  page?: number
  perPage?: number
  sortBy: string
  orderBy: 'ASC' | 'DESC'
}
