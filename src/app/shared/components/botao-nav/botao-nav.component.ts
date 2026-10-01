import { Component, computed, inject } from '@angular/core';
import { AppFacade } from '../../facade/app.facade';
import { AvisosService } from '../../services/avisos/avisos.service';
import { LayoutService } from '../../services/layout/layout.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { AppPage } from '../../store/app.store';

@Component({
  selector: 'app-botao-nav',
  imports: [],
  templateUrl: './botao-nav.component.html',
  styleUrl: './botao-nav.component.scss',
})
export class BotaoNavComponent {
  facade = inject(AppFacade);
  private navigation = inject(NavigationService);
  readonly avisos = inject(AvisosService);
  readonly layout = inject(LayoutService);

  readonly navItems = computed<{ id: AppPage; icon: string; label: string }[]>(() => [
    { id: 'home', icon: 'bi bi-house-door-fill', label: 'Início' },
    ...(this.facade.isGuide() ? [{ id: 'painel' as AppPage, icon: 'bi bi-compass-fill', label: 'Passeios' }] : []),
    ...(this.facade.isPromoter() ? [{ id: 'meus-eventos' as AppPage, icon: 'bi bi-calendar-event-fill', label: 'Eventos' }] : []),
    { id: 'reservas', icon: 'bi bi-ticket-perforated-fill', label: 'Reservas' },
    { id: 'chat', icon: 'bi bi-chat-dots-fill', label: 'Mensagens' },
    ...(this.facade.isGuide() || this.facade.isPromoter() ? [] : [{ id: 'favoritos' as AppPage, icon: 'bi bi-heart', label: 'Favoritos' }]),
    { id: 'perfil', icon: 'bi bi-person-fill', label: 'Perfil' },
  ]);

  private readonly abaDaPagina: Partial<Record<AppPage, AppPage>> = {
    passeio: 'home',
    buscar: 'home',
    avisos: 'home',
    resultados: 'home',
    'chat-tour': 'chat',
    'perfil-editar': 'perfil',
    'meus-passeios': 'painel',
    'passeio-form': 'painel',
    'passeio-gestao': 'painel',
    'minhas-solicitacoes': 'reservas',
    evento: 'home',
    analise: 'perfil',
  };

  readonly abaAtiva = computed(() => {
    const pagina = this.facade.currentPage();
    if (pagina === 'meus-eventos' || pagina === 'evento-form') return this.facade.isPromoter() ? 'meus-eventos' : 'perfil';
    return this.abaDaPagina[pagina] ?? pagina;
  });

  onSelect(id: AppPage): void {
    this.navigation.navigateTo(id);
  }
}
