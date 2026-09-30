import { Component, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppFacade } from '../../shared/facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { HomeResponse, Category, Activity } from '../../shared/enums/home.model';
import { TourService } from '../../shared/services/tour/tour.service';
import { FalhaDePosicao, LocalizacaoService } from '../../shared/services/localizacao/localizacao.service';
import { NavigationService } from '../../shared/services/navigation';
import { BotaoFavoritoComponent } from '../../shared/components/botao-favorito/botao-favorito.component';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { mensagemDeErro } from '../../shared/services/request/request-error';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BotaoFavoritoComponent, FalhaCarregarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly dados = inject(DadosClienteService);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);
  private readonly localizacao = inject(LocalizacaoService);
  readonly starIndexes = [0, 1, 2, 3, 4];
  
  dadosHome = signal<HomeResponse | null>(null);
  erro = signal('');
  searchQuery = signal<string>('');
  selectedCategoryId = signal<string>('all');
  categories = computed(() => this.dadosHome()?.categories ?? []);
  passeiosPerto = signal<Activity[] | null>(null);
  situacaoPerto = signal<'parado' | 'buscando' | 'sem-permissao' | 'erro' | 'pronto'>('parado');
  mostrandoPerto = computed(() => this.selectedCategoryId() === 'nearby');

  popularActivities = computed(() => {
    const all = this.dadosHome()?.popularActivities ?? [];
    const selectedId = this.selectedCategoryId();

    if (selectedId === 'all') return all;
    if (selectedId === 'nearby') return this.passeiosPerto() ?? [];

    const medida = selectedId === 'most-liked'
      ? (activity: Activity) => activity.likes ?? 0
      : selectedId === 'most-searched'
        ? (activity: Activity) => activity.searches ?? 0
        : null;
    if (!medida) return all;

    return all.filter((activity) => medida(activity) > 0).sort((a, b) => medida(b) - medida(a));
  });

  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHome();
  }

  buscarDadosHome(): void {
    this.dados.getHome().subscribe({
      next: (data) => {
        this.facade.setLoading(false);
        this.dadosHome.set(data);

        const activeCategory = data.categories.find((cat: Category) => cat.active);
        if (activeCategory) this.selectedCategoryId.set(activeCategory.id);
      },
      error: (error) => {
        this.facade.setLoading(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar os passeios agora.'));
      },
    });
  }

  tentarDeNovo(): void {
    this.erro.set('');
    this.facade.setLoading(true);
    this.buscarDadosHome();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  selectCategory(selectedId: string): void {
    this.selectedCategoryId.set(selectedId);
    if (selectedId === 'nearby' && this.situacaoPerto() !== 'pronto') this.buscarPasseiosPerto();
  }

  private buscarPasseiosPerto(): void {
    this.situacaoPerto.set('buscando');
    this.localizacao.acompanhar().subscribe({
      next: (posicao) => {
        this.tourService.listarPasseiosPerto(posicao.lat, posicao.lon).subscribe({
          next: (passeios) => {
            this.passeiosPerto.set(passeios);
            this.situacaoPerto.set('pronto');
          },
          error: () => this.situacaoPerto.set('erro'),
        });
      },
      error: (falha: FalhaDePosicao) => this.situacaoPerto.set(falha),
    });
  }

  abrirPasseio(tourId: string): void {
    this.navigationService.navigateToTour('passeio', Number(tourId));
  }

  textoDaListaVazia(): string {
    switch (this.selectedCategoryId()) {
      case 'most-liked': return 'Ninguém curtiu passeios ainda. Toque no coração dos que você gostar.';
      case 'most-searched': return 'Ninguém pediu vaga em passeios ainda.';
      default: return 'Ainda não tem passeios publicados por aqui.';
    }
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < Math.round(rating);
  }
}