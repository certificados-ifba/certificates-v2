import api from './axios'

export const loadAllPages = async <T>(
  url: string,
  params: Record<string, any> = {}
): Promise<T[]> => {
  const pageSize = 100

  const firstResponse = await api.get(url, {
    params: {
      ...params,
      page: 1,
      per_page: pageSize
    }
  })

  const firstRows: T[] =
    firstResponse?.data?.data ||
    firstResponse?.data?.events ||
    firstResponse?.data?.certificates ||
    (Array.isArray(firstResponse?.data) ? firstResponse?.data : [])
  const totalPages = Number(firstResponse?.headers?.['x-total-page'] || 1)

  if (totalPages <= 1) {
    return firstRows
  }

  const pagePromises = []
  for (let page = 2; page <= totalPages; page++) {
    pagePromises.push(
      api.get(url, {
        params: {
          ...params,
          page,
          per_page: pageSize
        }
      })
    )
  }

  const responses = await Promise.all(pagePromises)
  const remainingRows = responses.flatMap(
    res =>
      res?.data?.data ||
      res?.data?.events ||
      res?.data?.certificates ||
      (Array.isArray(res?.data) ? res?.data : [])
  )

  return [...firstRows, ...remainingRows]
}
