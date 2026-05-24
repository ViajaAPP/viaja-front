import {signalStore, withState, withMethods, withComputed, patchState} from '@ngrx/signals';
import { computed } from '@angular/core';

export type AppPage = 'welcome' | 'login' | 'home' | 'chat' |'chat-tour';

interface AppState {
  currentPage: AppPage;
  loading: boolean;
  selectedChatId: number | null;
  myUserId: number | null;
}

const initialState: AppState = {
  currentPage: 'welcome',
  loading: true,
  selectedChatId: null,
  myUserId: null,
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    navigateTo(page: AppPage, selectedChatId?: number) {
      patchState(store, { currentPage: page, selectedChatId });
    },
    setSelectedChatId(chatId?: number) {
      patchState(store, { selectedChatId: chatId });
    },
    setLoading(value: boolean) {
      patchState(store, { loading: value });
    },
    initializeApp() {
      setTimeout(() => {
        patchState(store, { loading: false });
      }, 2000);
    },
    setMyUserId(userId: number | null) {
      patchState(store, { myUserId: userId });
    }
  })),
  withComputed((store) => ({
    isWelcome: computed(() => store.currentPage() === 'welcome'),
    isLogin: computed(() => store.currentPage() === 'login'),
    isHome: computed(() => store.currentPage() === 'home'),
    isChat: computed(() => store.currentPage() === 'chat'),
    isChatTour: computed(() => store.currentPage() === 'chat-tour'),
  }))
);
