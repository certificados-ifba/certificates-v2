// Regras de escolha de modelo de certificado, compartilhadas pela lista de
// certificados, pelo assistente de publicação e pela validação de publicar.
//
// Um critério pode estar em dois formatos:
// - novo: { activity }                   → vale para a atividade do evento
// - antigo (2021): { type_activity, function } → vale para o tipo de atividade + função

export const getRefId = (value: any): string =>
  String(value?.id || value?._id || value || '')

export const isLegacyCriterion = (criterion: any): boolean =>
  !criterion?.activity && !!(criterion?.type_activity && criterion?.function)

export const criterionLabel = (criterion: any): string => {
  if (!isLegacyCriterion(criterion)) return criterion?.activity?.name || ''
  const typeName = criterion.type_activity?.name || 'tipo removido'
  const functionName = criterion.function?.name || 'função removida'
  return `${typeName} · ${functionName} (formato antigo)`
}

export const criterionMatchesCertificate = (
  criterion: any,
  certificate: any
): boolean => {
  if (criterion?.activity) {
    return getRefId(criterion.activity) === getRefId(certificate?.activity)
  }
  if (isLegacyCriterion(criterion)) {
    return (
      getRefId(criterion.type_activity) === getRefId(certificate?.activity?.type) &&
      getRefId(criterion.function) === getRefId(certificate?.function)
    )
  }
  return false
}

// Modelo específico cujo critério bate com o certificado; senão, o padrão.
export const findModelForCertificate = <
  T extends { is_default?: boolean; criterions?: any[] }
>(
  models: T[],
  certificate: any
): T | undefined =>
  models.find(
    model =>
      !model.is_default &&
      (model.criterions || []).some(criterion =>
        criterionMatchesCertificate(criterion, certificate)
      )
  ) || models.find(model => model.is_default)

// Baixado com este modelo e depois da última edição dele.
export const isDownloadedForModel = (
  certificate: any,
  modelId: string,
  modelUpdatedAt?: string
): boolean => {
  const download = (certificate?.downloads || []).find(
    (item: any) => getRefId(item.model) === modelId
  )
  if (!download?.downloaded_at) return false
  if (modelUpdatedAt && new Date(download.downloaded_at) < new Date(modelUpdatedAt)) {
    return false
  }
  return true
}

export interface IModelRow {
  key: string
  label: string
  certificates: any[]
}

// Linhas de um modelo no assistente: uma por critério (modelo específico) ou
// uma por atividade que cai no padrão. Cada linha traz só os certificados que
// de fato usam este modelo.
export const getModelRows = (
  model: { id: string; is_default?: boolean; criterions?: any[] },
  models: Array<{ id: string; is_default?: boolean; criterions?: any[] }>,
  activities: any[],
  certificates: any[]
): IModelRow[] => {
  const usesThisModel = (certificate: any) =>
    findModelForCertificate(models, certificate)?.id === model.id

  if (!model.is_default) {
    return (model.criterions || []).map((criterion, index) => ({
      key: `${getRefId(criterion.activity) || `${getRefId(criterion.type_activity)}|${getRefId(criterion.function)}`}-${index}`,
      label: criterionLabel(criterion),
      certificates: certificates.filter(
        certificate =>
          usesThisModel(certificate) && criterionMatchesCertificate(criterion, certificate)
      )
    }))
  }

  const activityIdsWithModel = new Set(
    models
      .filter(other => !other.is_default)
      .flatMap(other => (other.criterions || []).map(criterion => getRefId(criterion.activity)))
      .filter(Boolean)
  )

  return activities
    .filter(activity => !activityIdsWithModel.has(getRefId(activity)))
    .map(activity => {
      const ofActivity = certificates.filter(
        certificate => getRefId(certificate.activity) === getRefId(activity)
      )
      return {
        key: getRefId(activity),
        label: activity.name,
        hasCertificates: ofActivity.length > 0,
        certificates: ofActivity.filter(usesThisModel)
      }
    })
    // Atividade cujos certificados vão todos para modelos antigos sai do padrão
    .filter(row => !row.hasCertificates || row.certificates.length > 0)
    .map(({ key, label, certificates: rowCertificates }) => ({
      key,
      label,
      certificates: rowCertificates
    }))
}

// Linha pendente: tem certificado e nenhum foi baixado com este modelo.
export const isModelRowPending = (
  row: IModelRow,
  modelId: string,
  modelUpdatedAt?: string
): boolean =>
  row.certificates.length > 0 &&
  !row.certificates.some(certificate =>
    isDownloadedForModel(certificate, modelId, modelUpdatedAt)
  )

export interface ICriterionRole {
  number: number
  activity: { name: string; id: string }
  // Critério antigo preservado como veio do banco (tipo de atividade + função)
  legacy?: { type_activity: string; function: string }
}

// Critério do modelo → linha da tabela de critérios do formulário
export const criterionToRole = (criterion: any, index: number): ICriterionRole => {
  if (isLegacyCriterion(criterion)) {
    return {
      number: index + 1,
      activity: { name: criterionLabel(criterion), id: '' },
      legacy: {
        type_activity: getRefId(criterion.type_activity),
        function: getRefId(criterion.function)
      }
    }
  }
  const activity = criterion?.activity
  return {
    number: index + 1,
    activity: {
      name: typeof activity === 'object' ? activity?.name || '' : '',
      id: typeof activity === 'object' ? activity?.id || activity?.value || '' : String(activity)
    }
  }
}

// Linha do formulário → critério enviado à API (o antigo volta como estava)
export const roleToCriterion = (role: any) =>
  role?.legacy
    ? { type_activity: role.legacy.type_activity, function: role.legacy.function }
    : { activity: role?.activity?.value || role?.activity?.id || role?.activity }
