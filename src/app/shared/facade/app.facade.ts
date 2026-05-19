import { Injectable, inject } from '@angular/core';
import { AppStore } from '../store/app.store';

@Injectable({ providedIn: 'root' })
export class AppFacade {
  private store = inject(AppStore);

  currentPage = this.store.currentPage;
  loading = this.store.loading;
  isLogin = this.store.isLogin;

  setLoading(value: boolean) {
    this.store.setLoading(value);
  }

  initializeApp() {
    this.store.initializeApp();
  }
}
