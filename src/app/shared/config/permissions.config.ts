import { AppPage } from '../store/app.store';
import { UserRole } from '../enums/user.model';

export const PUBLIC_PAGES: AppPage[] = ['welcome', 'login', 'registrar', 'esqueci-senha', 'redefinir-senha'];

export const VISITOR_PAGES: AppPage[] = ['buscar', 'resultados'];

export const PAGE_ROLES: Partial<Record<AppPage, UserRole[]>> = {
  'meus-passeios': ['GUIDE', 'ADMIN'],
  'passeio-form': ['GUIDE'],
  'passeio-gestao': ['GUIDE'],
  'minhas-solicitacoes': ['TOURIST'],
  painel: ['GUIDE'],
  'meus-eventos': ['EVENT_PROMOTER', 'ADMIN'],
  'evento-form': ['EVENT_PROMOTER', 'ADMIN'],
  analise: ['ADMIN'],
};

export function canAccessPage(page: AppPage, role: UserRole | null, extraRoles: UserRole[] = []): boolean {
  if (PUBLIC_PAGES.includes(page) || VISITOR_PAGES.includes(page)) return true;
  if (!role) return false;
  const allowedRoles = PAGE_ROLES[page];
  return !allowedRoles || [role, ...extraRoles].some((papel) => allowedRoles.includes(papel));
}

export function resolveAllowedPage(page: AppPage, role: UserRole | null, extraRoles: UserRole[] = []): AppPage {
  if (canAccessPage(page, role, extraRoles)) return page;
  return role ? 'home' : 'login';
}
