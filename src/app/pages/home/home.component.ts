import { Component, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppFacade } from '../../shared/facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { HomeResponse, Category, Activity } from '../../shared/enums/home.model';
import { TourService } from '../../shared/services/tour/tour.service';
import { NavigationService } from '../../shared/services/navigation';
import { BotaoFavoritoComponent } from '../../shared/components/botao-favorito/botao-favorito.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BotaoFavoritoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly dados = inject(DadosClienteService);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);
  readonly starIndexes = [0, 1, 2, 3, 4];
  
  dadosHome = signal<HomeResponse | null>(null);
  searchQuery = signal<string>('');
  selectedCategoryId = signal<string>('all');
  fotoUser = computed(() => this.dadosHome()?.user?.fotoUser ?? '');
  categories = computed(() => this.dadosHome()?.categories ?? []);
  passeiosPerto = signal<Activity[] | null>(null);
  situacaoPerto = signal<'parado' | 'buscando' | 'sem-permissao' | 'erro' | 'pronto'>('parado');
  mostrandoPerto = computed(() => this.selectedCategoryId() === 'nearby');

  popularActivities = computed(() => {
    const all = this.dadosHome()?.popularActivities ?? [];
    const selectedId = this.selectedCategoryId();

    if (selectedId === 'all') return all;
    if (selectedId === 'nearby') return this.passeiosPerto() ?? [];

    const selectedLabel = this.categories().find(cat => cat.id === selectedId)?.label ?? '';

    return all.filter(activity =>
      activity.tag?.toLowerCase().includes(selectedLabel.toLowerCase())
    );
  });

  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHome();
  }

  buscarDadosHome(): void {
    this.dados
      .getHome().subscribe((data) => {
        this.facade.setLoading(false);
        this.dadosHome.set(data);

        const activeCategory = data.categories.find((cat: Category) => cat.active);
        if (activeCategory) this.selectedCategoryId.set(activeCategory.id);
      });
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
    if (!navigator.geolocation) {
      this.situacaoPerto.set('erro');
      return;
    }
    this.situacaoPerto.set('buscando');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.tourService.listarPasseiosPerto(coords.latitude, coords.longitude).subscribe({
          next: (passeios) => {
            this.passeiosPerto.set(passeios);
            this.situacaoPerto.set('pronto');
          },
          error: () => this.situacaoPerto.set('erro'),
        });
      },
      (erro) => this.situacaoPerto.set(erro.code === erro.PERMISSION_DENIED ? 'sem-permissao' : 'erro'),
      { timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  }

  abrirPasseio(tourId: string): void {
    this.navigationService.navigateToTour('passeio', Number(tourId));
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < rating;
  }
}