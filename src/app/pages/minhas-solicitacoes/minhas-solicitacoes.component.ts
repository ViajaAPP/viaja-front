import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NavigationService } from '../../shared/services/navigation';
import { TourService } from '../../shared/services/tour/tour.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { TourRequestItem } from '../../shared/enums/tour.model';
import { DATE_TIME_FORMAT, REQUEST_STATUS_LABELS } from '../../shared/config/tour.config';

@Component({
  selector: 'app-minhas-solicitacoes',
  imports: [DatePipe],
  templateUrl: './minhas-solicitacoes.component.html',
  styleUrl: './minhas-solicitacoes.component.scss',
})
export class MinhasSolicitacoesComponent implements OnInit {
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);

  readonly formatoData = DATE_TIME_FORMAT;
  readonly rotulosDaSolicitacao = REQUEST_STATUS_LABELS;

  solicitacoes = signal<TourRequestItem[]>([]);
  carregando = signal(true);
  erro = signal('');

  ngOnInit(): void {
    this.tourService.listarMinhasSolicitacoes().subscribe({
      next: (solicitacoes) => {
        this.carregando.set(false);
        this.solicitacoes.set(solicitacoes);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar suas reservas.'));
      },
    });
  }

  abrirPasseio(solicitacao: TourRequestItem): void {
    const tourId = solicitacao.tour_instance?.tour_id;
    if (tourId) this.navigationService.navigateToTour('passeio', tourId);
  }

  voltar(): void {
    this.navigationService.voltar('perfil');
  }
}
