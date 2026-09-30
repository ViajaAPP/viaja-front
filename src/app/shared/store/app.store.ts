import {signalStore, withState, withMethods, withComputed, patchState} from '@ngrx/signals';
import { computed } from '@angular/core';
import { UserRole } from '../enums/user.model';
import { resolveAllowedPage } from '../config/permissions.config';

export type AppPage =
  | 'welcome'
  | 'login'
  | 'registrar'
  | 'home'
  | 'chat'
  | 'chat-tour'
  | 'perfil'
  | 'passeio'
  | 'meus-passeios'
  | 'passeio-form'
  | 'passeio-gestao'
  | 'minhas-solicitacoes'
  | 'favoritos';

const PAGES_WITHOUT_BOTTOM_NAV: AppPage[] = ['welcome', 'login', 'registrar', 'chat-tour'];

interface AppState {
  currentPage: AppPage;
  loading: boolean;
  semConexao: boolean;
  selectedChatId: number | null;
  selectedTourId: number | null;
  myUserId: number | null;
  myRole: UserRole | null;
}

const initialState: AppState = {
  currentPage: 'welcome',
  loading: true,
  semConexao: false,
  selectedChatId: null,
  selectedTourId: null,
  myUserId: null,
  myRole: null,
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    navigateTo(page: AppPage, selectedChatId?: number) {
      patchState(store, { currentPage: resolveAllowedPage(page, store.myRole()), selectedChatId });
    },
    navigateToTour(page: AppPage, tourId: number | null) {
      patchState(store, { currentPage: resolveAllowedPage(page, store.myRole()), selectedTourId: tourId });
    },
    setSelectedChatId(chatId?: number) {
      patchState(store, { selectedChatId: chatId });
    },
    setLoading(value: boolean) {
      patchState(store, { loading: value });
    },
    avisarSemConexao() {
      patchState(store, { loading: false, semConexao: true });
    },
    tentarDeNovo() {
      patchState(store, { semConexao: false });
    },
    initializeApp() {
      setTimeout(() => {
        patchState(store, { loading: false });
      }, 2000);
    },
    startSession(userId: number, role: UserRole) {
      patchState(store, { myUserId: userId, myRole: role });
    },
    endSession() {
      patchState(store, { ...initialState, loading: false });
    }
  })),
  withComputed((store) => ({
    isWelcome: computed(() => store.currentPage() === 'welcome'),
    isLogin: computed(() => store.currentPage() === 'login'),
    isHome: computed(() => store.currentPage() === 'home'),
    isChat: computed(() => store.currentPage() === 'chat'),
    isChatTour: computed(() => store.currentPage() === 'chat-tour'),
    isGuide: computed(() => store.myRole() === 'GUIDE'),
    isTourist: computed(() => store.myRole() === 'TOURIST'),
    canManageTours: computed(() => store.myRole() === 'GUIDE' || store.myRole() === 'ADMIN'),
    showBottomNav: computed(() => !PAGES_WITHOUT_BOTTOM_NAV.includes(store.currentPage())),
  }))
);
