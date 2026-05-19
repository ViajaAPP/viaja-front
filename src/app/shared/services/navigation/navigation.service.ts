import { Injectable, inject } from '@angular/core';
import { AppStore, AppPage } from '../../store/app.store';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private store = inject(AppStore);

  navigateTo(page: AppPage) {
    this.store.navigateTo(page);
  }
}
