import type { AppPage } from '../store/app.store';

export function caminhoDaPagina(page: AppPage, id?: number | null): string {
  switch (page) {
    case 'welcome': return '/';
    case 'login': return '/entrar';
    case 'registrar': return '/cadastro';
    case 'home': return '/inicio';
    case 'chat': return '/mensagens';
    case 'chat-tour': return id ? `/mensagens/${id}` : '/mensagens';
    case 'perfil': return '/perfil';
    case 'perfil-editar': return '/perfil/editar';
    case 'favoritos': return '/favoritos';
    case 'passeio': return id ? `/passeio/${id}` : '/inicio';
    case 'meus-passeios': return '/meus-passeios';
    case 'passeio-form': return id ? `/meus-passeios/${id}/editar` : '/meus-passeios/novo';
    case 'passeio-gestao': return id ? `/meus-passeios/${id}` : '/meus-passeios';
    case 'minhas-solicitacoes': return '/minhas-solicitacoes';
  }
}
