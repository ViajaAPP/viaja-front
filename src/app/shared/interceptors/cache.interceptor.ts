import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { EMPTY, catchError, concat, of, tap } from 'rxjs';

const FRESCO = 15 * 1000;
const VALIDO = 10 * 60 * 1000;
const LEITURAS_POR_POST = ['/pages/'];
const SEMPRE_NA_HORA = ['/avisos/contagem', '/painel/contagem', '/auth/', '/locais/ponto'];

const guardadas = new Map<string, { resposta: HttpResponse<unknown>; em: number }>();

export function limparCacheDeRespostas(): void {
  guardadas.clear();
}

function ehLeitura(req: HttpRequest<unknown>): boolean {
  return req.method === 'GET' || (req.method === 'POST' && LEITURAS_POR_POST.some((p) => req.url.includes(p)));
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (!ehLeitura(req)) {
    return next(req).pipe(
      tap((evento) => {
        if (evento instanceof HttpResponse && evento.ok) limparCacheDeRespostas();
      }),
    );
  }
  if (SEMPRE_NA_HORA.some((p) => req.url.includes(p))) return next(req);

  const chave = `${req.headers.get('Authorization') ?? ''}|${req.method}|${req.urlWithParams}|${req.body ? JSON.stringify(req.body) : ''}`;
  const guardada = guardadas.get(chave);
  const idade = guardada ? Date.now() - guardada.em : Infinity;
  const buscar = next(req).pipe(
    tap((evento) => {
      if (evento instanceof HttpResponse && evento.ok) guardadas.set(chave, { resposta: evento.clone(), em: Date.now() });
    }),
  );

  if (!guardada || idade > VALIDO) return buscar;
  if (idade < FRESCO) return of(guardada.resposta.clone());
  return concat(of(guardada.resposta.clone()), buscar.pipe(catchError(() => EMPTY)));
};
