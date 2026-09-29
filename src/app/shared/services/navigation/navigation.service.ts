import { Injectable, inject } from '@angular/core';
import { AppStore, AppPage } from '../../store/app.store';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private store = inject(AppStore);

  navigateTo(page: AppPage, selectedChatId?: number) {
    this.store.navigateTo(page, selectedChatId);
  }

  navigateToTour(page: AppPage, tourId: number | null) {
    this.store.navigateToTour(page, tourId);
  }
}
