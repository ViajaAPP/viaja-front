import {signalStore, withState, withMethods, withComputed, patchState} from '@ngrx/signals';
import { computed } from '@angular/core';

export type AppPage = 'login' | 'home' | 'chat';

interface AppState {
  currentPage: AppPage;
  loading: boolean;
}

const initialState: AppState = {
  currentPage: 'login',
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
    isLogin: computed(() => store.currentPage() === 'login'),
  }))
);
