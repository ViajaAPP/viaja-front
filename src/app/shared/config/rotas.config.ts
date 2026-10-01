import type { AppPage } from '../store/app.store';

export function caminhoDaPagina(page: AppPage, id?: number | null): string {
  switch (page) {
    case 'welcome': return '/';
    case 'login': return '/entrar';
    case 'registrar': return '/cadastro';
    case 'esqueci-senha': return '/esqueci-senha';
    case 'redefinir-senha': return '/redefinir-senha';
    case 'home': return '/inicio';
    case 'buscar': return '/buscar';
    case 'avisos': return '/avisos';
    case 'painel': return '/painel';
    case 'reservas': return '/reservas';
    case 'resultados': return '/buscar/resultados';
    case 'chat': return '/mensagens';
    case 'chat-tour': return id ? `/mensagens/${id}` : '/mensagens';
    case 'perfil': return '/perfil';
    case 'perfil-editar': return '/perfil/editar';
    case 'favoritos': return '/favoritos';
    case 'passeio': return id ? `/passeio/${id}` : '/inicio';
    case 'meus-passeios': return '/meus-passeios';
    case 'passeio-form': return id ? `/meus-passeios/${id}/editar` : '/meus-passeios/novo';
    case 'passeio-gestao': return id ? `/meus-passeios/${id}` : '/meus-passeios';
    case 'minhas-solicitacoes': return '/reservas';
    case 'evento': return id ? `/evento/${id}` : '/inicio';
    case 'evento-form': return id ? `/meus-eventos/${id}/editar` : '/meus-eventos/novo';
    case 'meus-eventos': return '/meus-eventos';
    case 'analise': return '/analise';
  }
}
