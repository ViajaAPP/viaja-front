import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { TourService } from '../../shared/services/tour/tour.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { BotaoFavoritoComponent } from '../../shared/components/botao-favorito/botao-favorito.component';
import { TourDetail, TourInstance } from '../../shared/enums/tour.model';
import {
  DATE_TIME_FORMAT,
  PRICE_FORMAT,
  REQUEST_STATUS_LABELS,
} from '../../shared/config/tour.config';

@Component({
  selector: 'app-passeio',
  imports: [DatePipe, BotaoFavoritoComponent],
  templateUrl: './passeio.component.html',
  styleUrl: './passeio.component.scss',
})
export class PasseioComponent implements OnInit {
  readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);

  readonly formatoData = DATE_TIME_FORMAT;
  readonly rotulosDaSolicitacao = REQUEST_STATUS_LABELS;

  passeio = signal<TourDetail | null>(null);
  erro = signal('');
  sucesso = signal('');
  enviandoPara = signal<number | null>(null);

  ngOnInit(): void {
    this.buscarPasseio();
  }

  buscarPasseio(): void {
    const tourId = this.facade.selectedTourId();
    if (!tourId) return;
    this.tourService.buscarPasseio(tourId).subscribe({
      next: (passeio) => this.passeio.set(passeio),
      error: (error: HttpErrorResponse) =>
        this.erro.set(mensagemDeErro(error, 'Não encontramos esse passeio.')),
    });
  }

  formatarPreco(preco: number): string {
    return PRICE_FORMAT.format(preco);
  }

  textoDasVagas(data: TourInstance): string {
    if (!data.open_for_requests) return 'Não está recebendo pedidos';
    const livres = Math.max(data.max_capacity - (data.current_capacity ?? 0), 0);
    return livres === 1 ? '1 vaga livre' : `${livres} vagas livres`;
  }

  podePedirVaga(data: TourInstance): boolean {
    return this.facade.isTourist() && !!data.open_for_requests && !data.my_request_status;
  }

  pedirVaga(data: TourInstance): void {
    this.enviandoPara.set(data.id);
    this.erro.set('');
    this.tourService.solicitarVaga(data.id, '').subscribe({
      next: () => {
        this.enviandoPara.set(null);
        this.sucesso.set('Pedido enviado. O guia vai responder por aqui.');
        this.buscarPasseio();
      },
      error: (error: HttpErrorResponse) => {
        this.enviandoPara.set(null);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos enviar seu pedido.'));
      },
    });
  }

  gerenciar(): void {
    this.navigationService.navigateToTour('passeio-gestao', this.facade.selectedTourId());
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }
}
