import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { AppStore } from '../store/app.store';

const TEMPO_LIMITE = 15000;

export const conexaoInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AppStore);

  return next(req).pipe(
    timeout(TEMPO_LIMITE),
    catchError((erro) => {
      const falha = erro instanceof TimeoutError
        ? new HttpErrorResponse({ status: 0, url: req.url })
        : erro;

      if (falha instanceof HttpErrorResponse && falha.status === 0 && store.loading()) {
        store.avisarSemConexao();
      }

      return throwError(() => falha);
    })
  );
};
