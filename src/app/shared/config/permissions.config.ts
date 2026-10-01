import { AppPage } from '../store/app.store';
import { UserRole } from '../enums/user.model';

export const PUBLIC_PAGES: AppPage[] = ['welcome', 'login', 'registrar', 'esqueci-senha', 'redefinir-senha'];

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

export function canAccessPage(page: AppPage, role: UserRole | null): boolean {
  if (PUBLIC_PAGES.includes(page)) return true;
  if (!role) return false;
  const allowedRoles = PAGE_ROLES[page];
  return !allowedRoles || allowedRoles.includes(role);
}

export function resolveAllowedPage(page: AppPage, role: UserRole | null): AppPage {
  if (canAccessPage(page, role)) return page;
  return role ? 'home' : 'login';
}
