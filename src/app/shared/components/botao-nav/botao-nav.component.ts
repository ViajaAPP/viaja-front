import { Component, computed, inject } from '@angular/core';
import { AppFacade } from '../../facade/app.facade';
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

  readonly navItems: { id: AppPage | string; icon: string; label: string }[] = [
    { id: 'home', icon: 'bi bi-house-door-fill', label: 'Início' },
    { id: 'chat', icon: 'bi-chat-dots-fill', label: 'Mensagens' },
    { id: 'favoritos', icon: 'bi bi-heart', label: 'Favoritos' },
    { id: 'perfil', icon: 'bi-person-fill', label: 'Perfil' },
  ];

  private readonly abaDaPagina: Partial<Record<AppPage, AppPage>> = {
    passeio: 'home',
    'chat-tour': 'chat',
    'perfil-editar': 'perfil',
    'meus-passeios': 'perfil',
    'passeio-form': 'perfil',
    'passeio-gestao': 'perfil',
    'minhas-solicitacoes': 'perfil',
  };

  readonly abaAtiva = computed(() => {
    const pagina = this.facade.currentPage();
    return this.abaDaPagina[pagina] ?? pagina;
  });

  onSelect(id: string): void {
    if (id === 'home' || id === 'chat' || id === 'perfil' || id === 'favoritos') {
      this.navigation.navigateTo(id as AppPage);
    }
  }
}
