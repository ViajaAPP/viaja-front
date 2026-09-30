import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { DataDaAgenda, PainelService, PedidoDoPainel } from '../../shared/services/painel/painel.service';
import { TourService } from '../../shared/services/tour/tour.service';
import { ApiService } from '../../shared/services/api/api.service';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { AvisosService } from '../../shared/services/avisos/avisos.service';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { REQUEST_STATUS_LABELS } from '../../shared/config/tour.config';
import { Tour } from '../../shared/enums/tour.model';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';

registerLocaleData(localePt, 'pt-BR');

type Aba = 'pedidos' | 'agenda' | 'passeios';

interface DiaDaAgenda {
  rotulo: string;
  datas: DataDaAgenda[];
}

@Component({
  selector: 'app-painel',
  imports: [DatePipe, FalhaCarregarComponent],
  templateUrl: './painel.component.html',
  styleUrl: './painel.component.scss',
})
export class PainelComponent {
  private readonly facade = inject(AppFacade);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly painelService = inject(PainelService);
  private readonly tourService = inject(TourService);
  private readonly apiService = inject(ApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly avisos = inject(AvisosService);
  private readonly dadosCliente = inject(DadosClienteService);

  readonly rotulos = REQUEST_STATUS_LABELS;
  aba = signal<Aba>('pedidos');
  carregando = signal(true);
  erro = signal('');
  esperando = signal<PedidoDoPainel[]>([]);
  respondidos = signal<PedidoDoPainel[]>([]);
  dias = signal<DiaDaAgenda[]>([]);
  passeios = signal<Tour[]>([]);
  respondendo = signal<number | null>(null);
  nomeDoGuia = signal('');

  constructor() {
    this.dadosCliente.getHome().subscribe({ next: (dados) => this.nomeDoGuia.set(dados.user?.name ?? ''), error: () => {} });
    this.rota.queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      this.facade.setLoading(false);
      const aba = params.get('aba');
      this.aba.set(aba === 'agenda' || aba === 'passeios' ? aba : 'pedidos');
      this.carregar();
    });
  }

  trocarAba(aba: Aba): void {
    this.router.navigate([], { relativeTo: this.rota, queryParams: aba === 'pedidos' ? {} : { aba }, replaceUrl: true });
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    const falhou = (error: HttpErrorResponse) => {
      this.carregando.set(false);
      this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seu painel.'));
    };
    this.painelService.pedidos().subscribe({
      next: ({ esperando, respondidos }) => {
        this.esperando.set(esperando);
        this.respondidos.set(respondidos);
        if (this.aba() === 'pedidos') this.carregando.set(false);
      },
      error: falhou,
    });
    if (this.aba() === 'agenda') {
      this.painelService.agenda().subscribe({
        next: (agenda) => {
          this.dias.set(this.agruparPorDia(agenda));
          this.carregando.set(false);
        },
        error: falhou,
      });
    }
    if (this.aba() === 'passeios') {
      this.tourService.listarPasseiosGerenciados().subscribe({
        next: (passeios) => {
          this.passeios.set(passeios);
          this.carregando.set(false);
        },
        error: falhou,
      });
    }
  }

  horasRestantes(pedido: PedidoDoPainel): number {
    return Math.max(Math.ceil((new Date(pedido.expires_at).getTime() - Date.now()) / 3600000), 0);
  }

  textoDoPrazo(pedido: PedidoDoPainel): string {
    const horas = this.horasRestantes(pedido);
    if (horas <= 1) return 'Responda em menos de 1 hora';
    return `Responda em até ${horas} horas`;
  }

  async responder(pedido: PedidoDoPainel, aceitar: boolean): Promise<void> {
    const nome = pedido.requester?.first_name || 'essa pessoa';
    if (!aceitar) {
      const confirmou = await this.feedback.confirmar({
        titulo: `Recusar o pedido de ${nome}?`,
        texto: 'A pessoa vai ver que não conseguiu a vaga nessa data.',
        confirmar: 'Recusar',
        perigo: true,
      });
      if (!confirmou) return;
    }
    this.respondendo.set(pedido.id);
    this.tourService.responderSolicitacao(pedido.id, aceitar ? 'ACCEPTED' : 'DENIED').subscribe({
      next: () => {
        this.respondendo.set(null);
        this.feedback.sucesso(aceitar ? `${nome} está no grupo.` : 'Pedido recusado.');
        this.avisos.atualizar(true);
        this.carregar();
      },
      error: (error: HttpErrorResponse) => {
        this.respondendo.set(null);
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos responder o pedido. Tente de novo.'));
      },
    });
  }

  faltamParaSair(data: DataDaAgenda): number {
    return Math.max(data.min_participants - data.confirmed, 0);
  }

  ocupacao(data: DataDaAgenda): number {
    return data.max_capacity ? Math.min(Math.round((data.confirmed / data.max_capacity) * 100), 100) : 0;
  }

  abrirChat(data: DataDaAgenda): void {
    if (data.chat_id) {
      this.navigationService.navigateTo('chat-tour', data.chat_id);
      return;
    }
    this.apiService.startChat(data.id).subscribe({
      next: ({ chat_id }) => this.navigationService.navigateTo('chat-tour', chat_id),
      error: (error: HttpErrorResponse) => this.feedback.erro(mensagemDeErro(error, 'Não conseguimos abrir o chat.')),
    });
  }

  gerenciar(tourId: number): void {
    this.navigationService.navigateToTour('passeio-gestao', tourId);
  }

  editar(tourId: number): void {
    this.navigationService.navigateToTour('passeio-form', tourId);
  }

  novoPasseio(): void {
    this.navigationService.navigateToTour('passeio-form', null);
  }

  verPasseio(tourId: number): void {
    this.navigationService.navigateToTour('passeio', tourId);
  }

  proximasDatas(passeio: Tour): number {
    const agora = Date.now();
    return (passeio.tour_instance ?? []).filter((d) => d.status === 'SCHEDULED' && new Date(d.start_time).getTime() > agora).length;
  }

  private agruparPorDia(agenda: DataDaAgenda[]): DiaDaAgenda[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dias = new Map<string, DataDaAgenda[]>();
    for (const data of agenda) {
      const dia = new Date(data.start_time);
      dia.setHours(0, 0, 0, 0);
      const diferenca = Math.round((dia.getTime() - hoje.getTime()) / 86400000);
      const rotulo = diferenca === 0 ? 'Hoje' : diferenca === 1 ? 'Amanhã'
        : dia.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      dias.set(rotulo, [...(dias.get(rotulo) ?? []), data]);
    }
    return [...dias.entries()].map(([rotulo, datas]) => ({ rotulo: rotulo.charAt(0).toUpperCase() + rotulo.slice(1), datas }));
  }
}
