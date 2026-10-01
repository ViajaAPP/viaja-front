import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { PainelService, Viagem, Viagens } from '../../shared/services/painel/painel.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { REQUEST_STATUS_LABELS, PRICE_FORMAT } from '../../shared/config/tour.config';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { EventoService } from '../../shared/services/evento/evento.service';
import { Evento } from '../../shared/enums/evento.model';

registerLocaleData(localePt, 'pt-BR');

type Aba = 'proximas' | 'esperando' | 'passadas';

@Component({
  selector: 'app-viagens',
  imports: [DatePipe, FalhaCarregarComponent],
  templateUrl: './viagens.component.html',
  styleUrl: './viagens.component.scss',
})
export class ViagensComponent {
  private readonly facade = inject(AppFacade);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly painelService = inject(PainelService);
  private readonly eventoService = inject(EventoService);

  readonly rotulos = REQUEST_STATUS_LABELS;
  aba = signal<Aba>('proximas');
  tipo = signal<'passeios' | 'eventos'>('passeios');
  eventos = signal<{ proximos: Evento[]; passados: Evento[] } | null>(null);
  viagens = signal<Viagens>({ proximas: [], esperando: [], passadas: [], encerradas: [] });
  carregando = signal(true);
  erro = signal('');

  constructor() {
    this.rota.queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      this.facade.setLoading(false);
      const aba = params.get('aba');
      this.tipo.set(params.get('tipo') === 'eventos' ? 'eventos' : 'passeios');
      this.aba.set(aba === 'esperando' || aba === 'passadas' ? aba : 'proximas');
      if (this.tipo() === 'eventos' && this.aba() === 'esperando') this.aba.set('proximas');
      if (this.tipo() === 'eventos') this.carregarEventos();
    });
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.painelService.viagens().subscribe({
      next: (viagens) => {
        this.viagens.set(viagens);
        this.carregando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar suas reservas.'));
      },
    });
  }

  carregarEventos(): void {
    this.eventoService.ondeVou().subscribe({
      next: (eventos) => this.eventos.set(eventos),
      error: (error: HttpErrorResponse) => this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seus eventos.')),
    });
  }

  trocarTipo(tipo: 'passeios' | 'eventos'): void {
    this.router.navigate([], { relativeTo: this.rota, queryParams: tipo === 'eventos' ? { tipo } : {}, replaceUrl: true });
  }

  trocarAba(aba: Aba): void {
    const tipo = this.tipo() === 'eventos' ? { tipo: 'eventos' } : {};
    this.router.navigate([], { relativeTo: this.rota, queryParams: aba === 'proximas' ? tipo : { ...tipo, aba }, replaceUrl: true });
  }

  abrirEvento(evento: Evento): void {
    this.navigationService.navigateToTour('evento', evento.id);
  }

  explorarEventos(): void {
    this.navigationService.navigateTo('home');
  }

  horasRestantes(viagem: Viagem): number {
    return Math.max(Math.ceil((new Date(viagem.expires_at).getTime() - Date.now()) / 3600000), 0);
  }

  diasAte(viagem: { start_time: string }): string {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dia = new Date(viagem.start_time);
    dia.setHours(0, 0, 0, 0);
    const dias = Math.round((dia.getTime() - hoje.getTime()) / 86400000);
    if (dias <= 0) return 'É hoje!';
    if (dias === 1) return 'É amanhã';
    return `Faltam ${dias} dias`;
  }

  motivo(viagem: Viagem): string {
    if (viagem.instance_status === 'CANCELLED') return 'O guia cancelou essa data';
    return this.rotulos[viagem.status];
  }

  formatarPreco(preco: number): string {
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  abrirPasseio(viagem: Viagem): void {
    this.navigationService.navigateToTour('passeio', viagem.tour_id);
  }

  abrirChat(viagem: Viagem): void {
    if (viagem.chat_id) this.navigationService.navigateTo('chat-tour', viagem.chat_id);
  }

  explorar(): void {
    this.router.navigateByUrl('/buscar');
  }
}
