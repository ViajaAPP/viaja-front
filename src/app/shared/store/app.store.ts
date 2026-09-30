import {signalStore, withState, withMethods, withComputed, withHooks, patchState} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../enums/user.model';
import { caminhoDaPagina } from '../config/rotas.config';
import { AuthService } from '../services/auth/auth.service';

export type AppPage =
  | 'welcome'
  | 'login'
  | 'registrar'
  | 'esqueci-senha'
  | 'redefinir-senha'
  | 'home'
  | 'buscar'
  | 'resultados'
  | 'chat'
  | 'chat-tour'
  | 'perfil'
  | 'passeio'
  | 'meus-passeios'
  | 'passeio-form'
  | 'passeio-gestao'
  | 'minhas-solicitacoes'
  | 'favoritos'
  | 'perfil-editar';

const PAGES_WITHOUT_BOTTOM_NAV: AppPage[] = ['welcome', 'login', 'registrar', 'esqueci-senha', 'redefinir-senha', 'chat-tour', 'buscar'];

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
  withMethods((store, router = inject(Router)) => ({
    navigateTo(page: AppPage, selectedChatId?: number) {
      router.navigateByUrl(caminhoDaPagina(page, selectedChatId));
    },
    navigateToTour(page: AppPage, tourId: number | null) {
      router.navigateByUrl(caminhoDaPagina(page, tourId));
    },
    abrirPagina(page: AppPage, selectedTourId: number | null, selectedChatId: number | null) {
      patchState(store, { currentPage: page, selectedTourId, selectedChatId });
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
    endSession(destino = '/') {
      patchState(store, { ...initialState, loading: false });
      router.navigateByUrl(destino);
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
  })),
  withHooks({
    onInit(store) {
      const sessao = inject(AuthService).lerSessao();
      if (sessao) patchState(store, { myUserId: sessao.userId, myRole: sessao.role });
    },
  })
);
