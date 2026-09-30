import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
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

  readonly tourId = this.facade.selectedTourId();
  readonly formatoData = DATE_TIME_FORMAT;
  readonly rotulosDoRecebimento = REGISTRATION_LABELS;
  readonly rotulosDoStatus = TOUR_STATUS_LABELS;
  readonly rotulosDaSolicitacao = REQUEST_STATUS_LABELS;

  passeio = signal<TourDetail | null>(null);
  solicitacoes = signal<TourRequestItem[]>([]);
  dataAberta = signal<number | null>(null);
  erro = signal('');

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

  alternarPublicacao(passeio: TourDetail): void {
    this.executar(this.tourService.publicarPasseio(passeio.id, !passeio.published));
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
    this.executar(this.tourService.criarData(this.tourId, payload), () => {
      this.novaData = { inicio: '', vagas: VAGAS_PADRAO };
    });
  }

  salvarVagas(data: TourInstance): void {
    this.editarData(data, { max_capacity: this.vagasEditadas[data.id] });
  }

  mudarRecebimentoDePedidos(data: TourInstance, registration: RegistrationStatus): void {
    this.editarData(data, { registration });
  }

  mudarStatus(data: TourInstance, status: TourStatus): void {
    this.editarData(data, { status });
  }

  alternarSolicitacoes(data: TourInstance): void {
    if (this.dataAberta() === data.id) {
      this.dataAberta.set(null);
      return;
    }
    this.dataAberta.set(data.id);
    this.buscarSolicitacoes(data.id);
  }

  responder(solicitacao: TourRequestItem, status: RequestStatus): void {
    this.executar(this.tourService.responderSolicitacao(solicitacao.id, status));
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
    this.navigationService.navigateTo('meus-passeios');
  }

  private editarData(data: TourInstance, payload: TourInstancePayload): void {
    if (!this.tourId) return;
    this.executar(this.tourService.editarData(this.tourId, data.id, payload));
  }

  private buscarSolicitacoes(instanceId: number): void {
    this.tourService.listarSolicitacoesDaData(instanceId).subscribe({
      next: (solicitacoes) => this.solicitacoes.set(solicitacoes),
      error: (error: HttpErrorResponse) => this.mostrarErro(error),
    });
  }

  private executar(acao: Observable<unknown>, depois?: () => void): void {
    this.erro.set('');
    acao.subscribe({
      next: () => {
        depois?.();
        this.recarregar();
      },
      error: (error: HttpErrorResponse) => this.mostrarErro(error),
    });
  }

  private mostrarErro(error: HttpErrorResponse): void {
    this.erro.set(mensagemDeErro(error, 'Algo deu errado. Tente de novo.'));
  }
}
