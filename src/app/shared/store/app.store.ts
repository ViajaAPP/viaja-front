import {signalStore, withState, withMethods, withComputed, patchState} from '@ngrx/signals';
import { computed } from '@angular/core';

export type AppPage = 'welcome' | 'login' | 'home' | 'chat';

interface AppState {
  currentPage: AppPage;
  loading: boolean;
}

const initialState: AppState = {
  currentPage: 'welcome',
  loading: true,
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    navigateTo(page: AppPage) {
      patchState(store, { currentPage: page });
    },
    setLoading(value: boolean) {
      patchState(store, { loading: value });
    },
    initializeApp() {
      setTimeout(() => {
        patchState(store, { loading: false });
      }, 2000);
    },
  })),
  withComputed((store) => ({
    isWelcome: computed(() => store.currentPage() === 'welcome'),
    isLogin: computed(() => store.currentPage() === 'login'),
    isHome: computed(() => store.currentPage() === 'home'),
    isChat: computed(() => store.currentPage() === 'chat'),
  }))
);
