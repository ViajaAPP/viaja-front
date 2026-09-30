import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppPage, AppStore } from '../store/app.store';
import { PUBLIC_PAGES, resolveAllowedPage } from '../config/permissions.config';
import { caminhoDaPagina } from '../config/rotas.config';

function idDaRota(valor: string | null): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const paginaGuard: CanActivateFn = (route) => {
  const store = inject(AppStore);
  const router = inject(Router);
  const page = route.data['page'] as AppPage;
  const role = store.myRole();

  const destino = role && PUBLIC_PAGES.includes(page) ? 'home' : resolveAllowedPage(page, role);
  if (destino !== page) return router.parseUrl(caminhoDaPagina(destino));

  store.abrirPagina(page, idDaRota(route.paramMap.get('tourId')), idDaRota(route.paramMap.get('chatId')));
  return true;
};
