import { HttpErrorResponse } from '@angular/common/http';

export const MENSAGEM_SEM_CONEXAO = 'Erro ao consultar o servidor. Tente novamente.';

export function mensagemDeErro(error: HttpErrorResponse, padrao: string): string {
  if (error.status === 0) return MENSAGEM_SEM_CONEXAO;
  return error.error?.error || error.error?.message || padrao;
}
