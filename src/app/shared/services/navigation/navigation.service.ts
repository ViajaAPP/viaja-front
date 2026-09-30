import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { AppStore, AppPage } from '../../store/app.store';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private store = inject(AppStore);
  private location = inject(Location);
  private profundidade = 0;
  private voltandoPeloHistorico = false;

  constructor() {
    inject(Router).events.subscribe((evento) => {
      if (evento instanceof NavigationStart) {
        this.voltandoPeloHistorico = evento.navigationTrigger === 'popstate';
      }
      if (evento instanceof NavigationEnd) {
        this.profundidade = this.voltandoPeloHistorico
          ? Math.max(this.profundidade - 1, 1)
          : this.profundidade + 1;
      }
    });
  }

  navigateTo(page: AppPage, selectedChatId?: number) {
    this.store.navigateTo(page, selectedChatId);
  }

  navigateToTour(page: AppPage, tourId: number | null) {
    this.store.navigateToTour(page, tourId);
  }

  voltar(paginaPadrao: AppPage) {
    if (this.profundidade > 1) {
      this.location.back();
      return;
    }
    this.store.navigateTo(paginaPadrao);
  }
}
