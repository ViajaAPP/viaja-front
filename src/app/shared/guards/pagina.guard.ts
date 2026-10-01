import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppPage, AppStore } from '../store/app.store';
import { PUBLIC_PAGES, canAccessPage, resolveAllowedPage } from '../config/permissions.config';
import { caminhoDaPagina } from '../config/rotas.config';
import { AuthService } from '../services/auth/auth.service';
import { FeedbackService } from '../services/feedback/feedback.service';

function idDaRota(valor: string | null): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function caminhoDeVolta(url: string | null): string | null {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : null;
}

export const paginaGuard: CanActivateFn = (route, state) => {
  const store = inject(AppStore);
  const router = inject(Router);
  const page = route.data['page'] as AppPage;
  const role = store.myRole();

  if (!role && !canAccessPage(page, role)) {
    const entrar = router.createUrlTree(['/entrar'], { queryParams: { voltar: state.url } });
    if (!router.navigated) return entrar;
    return inject(FeedbackService)
      .confirmar({
        titulo: 'Entre para ver mais',
        texto: 'Crie sua conta ou entre para ver os detalhes, reservar e falar com o guia. É rapidinho.',
        confirmar: 'Entrar',
      })
      .then((quer) => (quer ? entrar : false));
  }

  const voltouSemSessao = page === 'welcome' && !role && !router.navigated && inject(AuthService).jaEntrou();
  const destino = role && PUBLIC_PAGES.includes(page)
    ? 'home'
    : voltouSemSessao ? 'login' : resolveAllowedPage(page, role);
  if (destino !== page) return router.parseUrl(caminhoDaPagina(destino));

  store.abrirPagina(page, idDaRota(route.paramMap.get('tourId') ?? route.paramMap.get('eventoId')), idDaRota(route.paramMap.get('chatId')));
  return true;
};
