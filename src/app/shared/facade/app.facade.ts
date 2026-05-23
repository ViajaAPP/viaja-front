import { Injectable, inject } from '@angular/core';
import { AppStore } from '../store/app.store';

@Injectable({ providedIn: 'root' })
export class AppFacade {
  private store = inject(AppStore);

  currentPage = this.store.currentPage;
  loading = this.store.loading;
  isWelcome = this.store.isWelcome;
  isLogin = this.store.isLogin;
  isHome = this.store.isHome;
  isChat = this.store.isChat;

  navigateTo(page: string) {
    this.store.navigateTo(page as any);
  }

  setLoading(value: boolean) {
    this.store.setLoading(value);
  }

  initializeApp() {
    this.store.initializeApp();
  }
}
