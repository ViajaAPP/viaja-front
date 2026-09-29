import { Injectable, inject } from '@angular/core';
import { AppStore } from '../store/app.store';
import { UserRole } from '../enums/user.model';

@Injectable({ providedIn: 'root' })
export class AppFacade {
  private store = inject(AppStore);

  currentPage = this.store.currentPage;
  loading = this.store.loading;
  isWelcome = this.store.isWelcome;
  isLogin = this.store.isLogin;
  isHome = this.store.isHome;
  isChat = this.store.isChat;
  myUserId = this.store.myUserId;
  myRole = this.store.myRole;
  selectedTourId = this.store.selectedTourId;
  isGuide = this.store.isGuide;
  isTourist = this.store.isTourist;
  canManageTours = this.store.canManageTours;
  showBottomNav = this.store.showBottomNav;

  navigateTo(page: string) {
    this.store.navigateTo(page as any);
  }

  setLoading(value: boolean) {
    this.store.setLoading(value);
  }

  startSession(userId: number, role: UserRole) {
    this.store.startSession(userId, role);
  }

  endSession() {
    this.store.endSession();
  }

  initializeApp() {
    this.store.initializeApp();
  }
}
