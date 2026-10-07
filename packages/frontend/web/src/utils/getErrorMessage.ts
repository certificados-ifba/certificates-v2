export const getErrorMessage = (
  error: string,
  errors?: { [key: string]: any } | null
): string => {
  let message: string
  switch (error) {
    case 'permission_check_forbidden':
      message = 'Seu usuário não possui permissão para realizar essa ação.'
      break
    case 'user_create_conflict':
    case 'user_update_by_id_conflict':
      message = errors.email
        ? 'E-mail já cadastrado, tente com um diferente.'
        : errors.cpf
          ? 'CPF já cadastrado, tente com um diferente.'
          : 'Conflito encontrado, verifique os dados informados.'
      break
    case 'user_get_by_link_expired':
      message = 'Link expirado, favor tente novamente.'
      break
    case 'user_search_by_credentials_invalid':
    case 'user_search_by_credentials_not_match':
    case 'user_search_by_credentials_not_found':
      message = 'Por favor, verifique seu usuário e sua senha.'
      break
    case 'user_forgot_password_not_found':
      message = 'E-mail não encontrado, favor informar um e-mail cadastrado.'
      break
    case 'user_get_by_cpf_not_found':
      message = 'CPF válido, porém o participante não está cadastrado.'
      break
    case 'user_get_by_cpf_bad_request':
      message = 'CPF inválido. Revise o valor informado na planilha.'
      break
    case 'generic_create_conflict_name':
    case 'generic_update_by_id_conflict_name':
      message = 'Este nome já está cadastrado, tente com um diferente.'
      break
    case 'certificate_validate_not_found':
      message =
        'Certificado não encontrado, verifique o código e tente novamente.'
      break
    case 'activity_create_conflict':
      message = 'Atividade já cadastrada, tente com o nome ou tipo diferente.'
      break
    case 'certificate_create_participant_not_found':
      message = 'Participante não cadastrado'
      break
    case 'certificate_create_conflict_same_function':
      message =
        'O participante já possui um certificado com esta função nesta atividade.'
      break
    case 'certificate_create_conflict_duplicate':
      message =
        'O participante já possui outra função cadastrada nesta atividade.'
      break
    case 'model_create_precondition_failed':
      message = errors
        ? Object.values(errors)
            .map((e: any) => e.message)
            .join(', ')
        : 'Dados inválidos para criar o modelo de certificado.'
      break
    case 'model_create_conflict_activity':
    case 'model_update_conflict_activity':
      message = `Cada atividade só pode pertencer a um modelo. Já vinculada: ${(
        errors?.conflicts || []
      )
        .map((conflict: any) => `${conflict.activity} (${conflict.model})`)
        .join(', ')}.`
      break
    case 'model_create_bad_request':
      message = 'Dados incompletos para criar o modelo de certificado.'
      break
    case 'event_get_by_id_not_found':
      message = 'Evento não encontrado.'
      break
    case 'event_get_by_id_forbidden':
      message = 'Você não tem permissão para acessar este evento.'
      break
    case 'event_update_by_id_forbidden':
      message = 'Você não tem permissão para editar este evento.'
      break
    case 'event_update_by_id_not_found':
      message = 'Evento não encontrado.'
      break
    case 'event_update_by_id_precondition_failed':
      message = 'Dados inválidos ao atualizar o evento.'
      break
    case 'participant_delete_conflict':
      message =
        'O participante não pode ser removido porque está vinculado a um evento.'
      break
    default:
      message =
        error && /\s/.test(error)
          ? error
          : typeof errors === 'string'
          ? errors
          : errors?.message && /\s/.test(String(errors.message))
          ? String(errors.message)
          : 'Erro desconhecido, favor entrar em contato com o administrador.'
      break
  }
  return message
}
