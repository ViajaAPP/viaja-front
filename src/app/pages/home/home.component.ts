import { Component, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppFacade } from '../../shared/facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { HomeResponse, Category } from '../../shared/enums/home.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly dados = inject(DadosClienteService);
  private readonly destroyRef = inject(DestroyRef);

  dadosHome = signal<HomeResponse | null>(null);
  searchQuery = signal<string>('');
  selectedCategoryId = signal<string>('all');

  categories = computed(() => this.dadosHome()?.categories ?? []);

  popularActivities = computed(() => {
    const all = this.dadosHome()?.popularActivities ?? [];
    const selectedId = this.selectedCategoryId();

    if (selectedId === 'all') return all;

    const selectedLabel = this.categories().find(cat => cat.id === selectedId)?.label ?? '';

    return all.filter(activity =>
      activity.tag?.toLowerCase().includes(selectedLabel.toLowerCase())
    );
  });

  fotoUser = computed(() => this.dadosHome()?.user?.fotoUser ?? '');

  readonly starIndexes = [0, 1, 2, 3, 4];

  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHome();
  }

  buscarDadosHome(): void {
    this.dados
      .getHome()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        console.log('<< DADOS HOME >>:', data);
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
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < rating;
  }
}