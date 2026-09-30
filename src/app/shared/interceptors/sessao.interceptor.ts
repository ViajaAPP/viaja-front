import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AppStore } from '../store/app.store';
import { AuthService } from '../services/auth/auth.service';
import { DadosClienteService } from '../services/dados-cliente/dados-cliente.service';

export const sessaoInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const store = inject(AppStore);
  const dadosClienteService = inject(DadosClienteService);

  return next(req).pipe(
    catchError((erro) => {
      if (erro instanceof HttpErrorResponse && erro.status === 401 && authService.getToken()) {
        authService.clearToken();
        dadosClienteService.limparCache();
        store.endSession('/entrar?sessao=expirada');
      }

      return throwError(() => erro);
    })
  );
};
