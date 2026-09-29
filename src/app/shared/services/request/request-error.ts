import { HttpErrorResponse } from '@angular/common/http';

export function mensagemDeErro(error: HttpErrorResponse, padrao: string): string {
  return error.error?.error || error.error?.message || padrao;
}
