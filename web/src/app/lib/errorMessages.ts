import { isAxiosError } from 'axios';

/** API error codes → messages shown to the user. The only place with this mapping. */
const messages: Record<string, string> = {
  VALIDATION: 'Verifique os dados informados.',
  BAD_REQUEST: 'Requisição inválida.',
  UNAUTHORIZED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para fazer isso.',
  NOT_FOUND: 'Não encontrado.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
  INTERNAL_SERVER_ERROR: 'Algo deu errado. Tente novamente em instantes.',
  EMAIL_ALREADY_IN_USE: 'Este email já está cadastrado.',
  INVALID_CREDENTIALS: 'Email ou senha inválidos.',
  EMAIL_NOT_VERIFIED: 'Confirme seu email para continuar.',
  INVALID_VERIFICATION_CODE: 'Código inválido ou expirado.',
  INVALID_REFRESH_TOKEN: 'Sua sessão expirou. Entre novamente.',
  OAUTH_FAILED: 'Não foi possível entrar com o provedor. Tente novamente.',
  OAUTH_EMAIL_NOT_VERIFIED: 'O provedor não confirmou seu email. Use outro método de login.',
};

const FALLBACK = messages.INTERNAL_SERVER_ERROR!;

export function getErrorCode(error: unknown): string | null {
  if (isAxiosError<{ error?: { code?: string } }>(error)) {
    return error.response?.data?.error?.code ?? null;
  }

  return null;
}

export function getMessageForCode(code: string | null | undefined): string {
  return (code && messages[code]) || FALLBACK;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error) && !error.response) {
    return 'Não foi possível conectar ao servidor.';
  }

  return getMessageForCode(getErrorCode(error));
}
