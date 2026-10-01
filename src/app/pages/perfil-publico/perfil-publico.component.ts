import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { PerfilPublicoService } from '../../shared/services/perfil-publico/perfil-publico.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { PerfilPublico } from '../../shared/enums/perfil-publico.model';
import { PRICE_FORMAT, ROLE_LABELS } from '../../shared/config/tour.config';
import { CartaoPerfilComponent } from '../../shared/components/cartao-perfil/cartao-perfil.component';
import { CartaoPasseioComponent } from '../../shared/components/cartao-passeio/cartao-passeio.component';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';

registerLocaleData(localePt, 'pt-BR');

@Component({
  selector: 'app-perfil-publico',
  imports: [DatePipe, CartaoPerfilComponent, CartaoPasseioComponent, FalhaCarregarComponent],
  templateUrl: './perfil-publico.component.html',
  styleUrl: './perfil-publico.component.scss',
})
export class PerfilPublicoComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly navigationService = inject(NavigationService);
  private readonly perfilPublicoService = inject(PerfilPublicoService);

  perfil = signal<PerfilPublico | null>(null);
  erro = signal('');
  private userId: number | null = null;

  numeros = computed(() => {
    const dados = this.perfil();
    if (!dados) return [];
    const { traveler, guide, promoter } = dados.stats;
    const itens: { valor: string | number; rotulo: string }[] = [];
    if (guide) {
      itens.push({ valor: guide.travelers_guided, rotulo: guide.travelers_guided === 1 ? 'viajante guiado' : 'viajantes guiados' });
      itens.push({ valor: guide.tours_done, rotulo: guide.tours_done === 1 ? 'passeio realizado' : 'passeios realizados' });
      itens.push({ valor: guide.tours_active, rotulo: guide.tours_active === 1 ? 'passeio no ar' : 'passeios no ar' });
    }
    if (promoter) {
      itens.push({ valor: promoter.events_done, rotulo: promoter.events_done === 1 ? 'evento realizado' : 'eventos realizados' });
      itens.push({ valor: promoter.people_attended, rotulo: promoter.people_attended === 1 ? 'pessoa foi' : 'pessoas foram' });
      itens.push({ valor: promoter.events_upcoming, rotulo: promoter.events_upcoming === 1 ? 'evento chegando' : 'eventos chegando' });
    }
    if (traveler) {
      itens.push({ valor: traveler.trips, rotulo: traveler.trips === 1 ? 'viagem' : 'viagens' });
      itens.push({ valor: traveler.events_attended, rotulo: traveler.events_attended === 1 ? 'evento' : 'eventos' });
      itens.push({ valor: traveler.cities.length, rotulo: traveler.cities.length === 1 ? 'cidade' : 'cidades' });
      itens.push({ valor: traveler.reviews_written, rotulo: traveler.reviews_written === 1 ? 'avaliação' : 'avaliações' });
    }
    return itens;
  });

  colunasDosNumeros = computed(() => {
    const total = this.numeros().length;
    return total === 2 || total === 4 ? 2 : Math.min(total, 3);
  });

  tipoDeConta = computed(() => {
    const role = this.perfil()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('userId'));
      this.userId = Number.isInteger(id) && id > 0 ? id : null;
      this.carregar();
    });
  }

  carregar(): void {
    this.perfil.set(null);
    this.erro.set('');
    if (this.userId === null) return this.voltar();
    this.perfilPublicoService.buscar(this.userId).subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.facade.setLoading(false);
      },
      error: (error: HttpErrorResponse) => {
        this.facade.setLoading(false);
        if (error.status === 404) return this.voltar();
        this.erro.set(mensagemDeErro(error, 'Não conseguimos abrir esse perfil agora.'));
      },
    });
  }

  primeiroNome(): string {
    return this.perfil()?.is_me ? 'você' : this.perfil()?.first_name ?? '';
  }

  formatarPreco(preco: number): string {
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  abrirPerfil(userId: number): void {
    this.navigationService.abrirPerfil(userId);
  }

  abrirPasseio(tourId: number): void {
    this.navigationService.navigateToTour('passeio', tourId);
  }

  abrirEvento(eventoId: number): void {
    this.navigationService.navigateToTour('evento', eventoId);
  }

  editarPerfil(): void {
    this.navigationService.navigateTo('perfil-editar');
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }
}
