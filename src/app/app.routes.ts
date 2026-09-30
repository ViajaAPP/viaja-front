import { Routes } from '@angular/router';
import { paginaGuard } from './shared/guards/pagina.guard';
import { alteracoesGuard } from './shared/guards/alteracoes.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: { page: 'welcome' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/welcome/welcome.component').then((m) => m.WelcomeComponent),
  },
  {
    path: 'entrar',
    data: { page: 'login' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    data: { page: 'registrar' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/registrar/registrar.component').then((m) => m.RegistrarComponent),
  },
  {
    path: 'esqueci-senha',
    data: { page: 'esqueci-senha' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then((m) => m.EsqueciSenhaComponent),
  },
  {
    path: 'redefinir-senha',
    data: { page: 'redefinir-senha' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/redefinir-senha/redefinir-senha.component').then((m) => m.RedefinirSenhaComponent),
  },
  {
    path: 'inicio',
    data: { page: 'home' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'buscar',
    data: { page: 'buscar' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/buscar/buscar.component').then((m) => m.BuscarComponent),
  },
  {
    path: 'buscar/resultados',
    data: { page: 'resultados' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/resultados/resultados.component').then((m) => m.ResultadosComponent),
  },
  {
    path: 'painel',
    data: { page: 'painel' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/painel/painel.component').then((m) => m.PainelComponent),
  },
  {
    path: 'viagens',
    data: { page: 'viagens' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/viagens/viagens.component').then((m) => m.ViagensComponent),
  },
  {
    path: 'avisos',
    data: { page: 'avisos' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/avisos/avisos.component').then((m) => m.AvisosComponent),
  },
  {
    path: 'mensagens',
    data: { page: 'chat' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'mensagens/:chatId',
    data: { page: 'chat-tour' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/chat-message/chat-message.component').then((m) => m.ChatMessageComponent),
  },
  {
    path: 'perfil',
    data: { page: 'perfil' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
  },
  {
    path: 'perfil/editar',
    data: { page: 'perfil-editar' },
    canActivate: [paginaGuard],
    canDeactivate: [alteracoesGuard],
    loadComponent: () => import('./pages/perfil-editar/perfil-editar.component').then((m) => m.PerfilEditarComponent),
  },
  {
    path: 'favoritos',
    data: { page: 'favoritos' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/favoritos/favoritos.component').then((m) => m.FavoritosComponent),
  },
  {
    path: 'passeio/:tourId',
    data: { page: 'passeio' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/passeio/passeio.component').then((m) => m.PasseioComponent),
  },
  {
    path: 'meus-passeios',
    data: { page: 'meus-passeios' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/meus-passeios/meus-passeios.component').then((m) => m.MeusPasseiosComponent),
  },
  {
    path: 'meus-passeios/novo',
    data: { page: 'passeio-form' },
    canActivate: [paginaGuard],
    canDeactivate: [alteracoesGuard],
    loadComponent: () => import('./pages/passeio-form/passeio-form.component').then((m) => m.PasseioFormComponent),
  },
  {
    path: 'meus-passeios/:tourId',
    data: { page: 'passeio-gestao' },
    canActivate: [paginaGuard],
    loadComponent: () => import('./pages/passeio-gestao/passeio-gestao.component').then((m) => m.PasseioGestaoComponent),
  },
  {
    path: 'meus-passeios/:tourId/editar',
    data: { page: 'passeio-form' },
    canActivate: [paginaGuard],
    canDeactivate: [alteracoesGuard],
    loadComponent: () => import('./pages/passeio-form/passeio-form.component').then((m) => m.PasseioFormComponent),
  },
  { path: 'minhas-solicitacoes', redirectTo: 'viagens' },
  { path: '**', redirectTo: '' },
];
