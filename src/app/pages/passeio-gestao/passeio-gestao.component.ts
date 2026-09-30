import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { ValidarFormularioDirective } from '../../shared/directives/validar-formulario.directive';
import { TourService } from '../../shared/services/tour/tour.service';
import { ApiService } from '../../shared/services/api/api.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import {
  RegistrationStatus,
  RequestStatus,
  TourDetail,
  TourInstance,
  TourInstancePayload,
  TourRequestItem,
  TourStatus,
} from '../../shared/enums/tour.model';
import {
  DATE_TIME_FORMAT,
  REGISTRATION_LABELS,
  REQUEST_STATUS_LABELS,
  TOUR_STATUS_LABELS,
} from '../../shared/config/tour.config';

const VAGAS_PADRAO = 10;

@Component({
  selector: 'app-passeio-gestao',
  imports: [DatePipe, FormsModule, ValidarFormularioDirective],
  templateUrl: './passeio-gestao.component.html',
  styleUrl: './passeio-gestao.component.scss',
})
export class PasseioGestaoComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);
  private readonly apiService = inject(ApiService);
  private readonly feedback = inject(FeedbackService);

  readonly tourId = this.facade.selectedTourId();
  readonly formatoData = DATE_TIME_FORMAT;
  readonly rotulosDoRecebimento = REGISTRATION_LABELS;
  readonly rotulosDoStatus = TOUR_STATUS_LABELS;
  readonly rotulosDaSolicitacao = REQUEST_STATUS_LABELS;

  passeio = signal<TourDetail | null>(null);
  solicitacoes = signal<TourRequestItem[]>([]);
  dataAberta = signal<number | null>(null);
  erro = signal('');
  ocupado = signal(false);

  novaData = { inicio: '', vagas: VAGAS_PADRAO };
  vagasEditadas: Record<number, number> = {};

  ngOnInit(): void {
    this.recarregar();
  }

  recarregar(): void {
    if (!this.tourId) return;
    this.tourService.buscarPasseio(this.tourId).subscribe({
      next: (passeio) => {
        this.passeio.set(passeio);
        this.vagasEditadas = Object.fromEntries(
          passeio.instances.map((data) => [data.id, data.max_capacity]),
        );
      },
      error: (error: HttpErrorResponse) => this.mostrarErro(error),
    });
    const dataAberta = this.dataAberta();
    if (dataAberta) this.buscarSolicitacoes(dataAberta);
  }

  async alternarPublicacao(passeio: TourDetail): Promise<void> {
    if (passeio.published) {
      const confirmou = await this.feedback.confirmar({
        titulo: 'Tirar o passeio do ar?',
        texto: 'Ele some da busca e ninguém consegue pedir vaga até você publicar de novo.',
        confirmar: 'Tirar do ar',
      });
      if (!confirmou) return;
    }
    this.executar(
      this.tourService.publicarPasseio(passeio.id, !passeio.published),
      passeio.published ? 'Passeio fora do ar.' : 'Passeio publicado.',
    );
  }

  agora(): string {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    return agora.toISOString().slice(0, 16);
  }

  criarData(): void {
    if (!this.tourId || !this.novaData.inicio) return;
    if (new Date(this.novaData.inicio) <= new Date()) {
      this.erro.set('Escolha um dia e horário que ainda não passaram.');
      return;
    }
    const payload = {
      start_time: new Date(this.novaData.inicio).toISOString(),
      max_capacity: this.novaData.vagas,
    };
    this.executar(this.tourService.criarData(this.tourId, payload), 'Data adicionada.', () => {
      this.novaData = { inicio: '', vagas: VAGAS_PADRAO };
    });
  }

  salvarVagas(data: TourInstance): void {
    const vagas = Number(this.vagasEditadas[data.id]);
    const ocupadas = data.current_capacity ?? 0;
    if (!vagas || vagas < Math.max(ocupadas, 1)) {
      this.feedback.erro(ocupadas
        ? `Já tem ${ocupadas} ${ocupadas === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}. As vagas não podem ficar abaixo disso.`
        : 'Coloque pelo menos 1 vaga.');
      return;
    }
    this.editarData(data, { max_capacity: vagas }, 'Vagas salvas.');
  }

  mudarRecebimentoDePedidos(data: TourInstance, registration: RegistrationStatus): void {
    this.editarData(data, { registration }, registration === 'OPEN' ? 'Pedidos abertos de novo.' : 'Pedidos fechados para essa data.');
  }

  async mudarStatus(data: TourInstance, status: TourStatus): Promise<void> {
    const cancelar = status === 'CANCELLED';
    const confirmou = await this.feedback.confirmar(cancelar
      ? {
          titulo: 'Cancelar essa data?',
          texto: 'Quem já tem vaga vai ver que a data foi cancelada. Isso não dá para desfazer.',
          confirmar: 'Cancelar data',
          perigo: true,
        }
      : {
          titulo: 'O passeio já aconteceu?',
          texto: 'A data sai da lista de próximas e não recebe mais pedidos. Isso não dá para desfazer.',
          confirmar: 'Já aconteceu',
        });
    if (!confirmou) return;
    this.editarData(data, { status }, cancelar ? 'Data cancelada.' : 'Data marcada como realizada.');
  }

  alternarSolicitacoes(data: TourInstance): void {
    if (this.dataAberta() === data.id) {
      this.dataAberta.set(null);
      return;
    }
    this.dataAberta.set(data.id);
    this.buscarSolicitacoes(data.id);
  }

  async responder(solicitacao: TourRequestItem, status: RequestStatus): Promise<void> {
    const nome = solicitacao.requester?.first_name || 'essa pessoa';
    if (status === 'DENIED') {
      const confirmou = await this.feedback.confirmar({
        titulo: `Recusar o pedido de ${nome}?`,
        texto: 'A pessoa vai ver que não conseguiu a vaga nessa data.',
        confirmar: 'Recusar',
        perigo: true,
      });
      if (!confirmou) return;
    }
    this.executar(
      this.tourService.responderSolicitacao(solicitacao.id, status),
      status === 'ACCEPTED' ? `${nome} está no grupo.` : 'Pedido recusado.',
    );
  }

  abrirChat(data: TourInstance): void {
    this.apiService.startChat(data.id).subscribe({
      next: ({ chat_id }) => this.navigationService.navigateTo('chat-tour', chat_id),
      error: (error: HttpErrorResponse) => this.mostrarErro(error),
    });
  }

  estaAgendada(data: TourInstance): boolean {
    return data.status === 'SCHEDULED';
  }

  editarPasseio(): void {
    this.navigationService.navigateToTour('passeio-form', this.tourId);
  }

  voltar(): void {
    this.navigationService.voltar('meus-passeios');
  }

  private editarData(data: TourInstance, payload: TourInstancePayload, sucesso: string): void {
    if (!this.tourId) return;
    this.executar(this.tourService.editarData(this.tourId, data.id, payload), sucesso);
  }

  private buscarSolicitacoes(instanceId: number): void {
    this.tourService.listarSolicitacoesDaData(instanceId).subscribe({
      next: (solicitacoes) => this.solicitacoes.set(solicitacoes),
      error: (error: HttpErrorResponse) => this.mostrarErro(error),
    });
  }

  private executar(acao: Observable<unknown>, sucesso: string, depois?: () => void): void {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.erro.set('');
    acao.subscribe({
      next: () => {
        this.ocupado.set(false);
        depois?.();
        this.feedback.sucesso(sucesso);
        this.recarregar();
      },
      error: (error: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.feedback.erro(mensagemDeErro(error, 'Algo deu errado. Tente de novo.'));
      },
    });
  }

  private mostrarErro(error: HttpErrorResponse): void {
    this.erro.set(mensagemDeErro(error, 'Algo deu errado. Tente de novo.'));
  }
}
