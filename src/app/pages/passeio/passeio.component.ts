import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { TourService } from '../../shared/services/tour/tour.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { BotaoFavoritoComponent } from '../../shared/components/botao-favorito/botao-favorito.component';
import { MapaComponent } from '../../shared/components/mapa/mapa.component';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { TourDetail, TourInstance } from '../../shared/enums/tour.model';
import {
  DATE_TIME_FORMAT,
  PRICE_FORMAT,
  REQUEST_STATUS_LABELS,
} from '../../shared/config/tour.config';

registerLocaleData(localePt, 'pt-BR');

@Component({
  selector: 'app-passeio',
  imports: [DatePipe, FormsModule, BotaoFavoritoComponent, MapaComponent],
  templateUrl: './passeio.component.html',
  styleUrl: './passeio.component.scss',
})
export class PasseioComponent implements OnInit {
  readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);
  private readonly feedback = inject(FeedbackService);

  readonly formatoData = DATE_TIME_FORMAT;
  readonly rotulosDaSolicitacao = REQUEST_STATUS_LABELS;

  passeio = signal<TourDetail | null>(null);
  erro = signal('');
  sucesso = signal('');
  enviandoPara = signal<number | null>(null);
  fotoAtual = signal(0);
  minhaNota = signal(0);
  meuComentario = '';
  avaliando = signal(false);
  fotos = computed(() => {
    const passeio = this.passeio();
    if (!passeio) return [];
    return [
      { url: passeio.photo, credit: passeio.photo_credit ?? null },
      ...(passeio.photos ?? []).map((foto) => ({ url: foto.url, credit: foto.credit })),
    ].filter((foto) => !!foto.url);
  });

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

  formatarDuracao(minutos: number): string {
    if (minutos < 60) return `Cerca de ${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    const textoHoras = horas === 1 ? '1 hora' : `${horas} horas`;
    return resto ? `Cerca de ${textoHoras} e ${resto} minutos` : `Cerca de ${textoHoras}`;
  }

  linkDoUber(passeio: TourDetail): string {
    const destino = {
      latitude: passeio.address?.lat,
      longitude: passeio.address?.lon,
      addressLine1: passeio.meeting_point || passeio.title,
      addressLine2: this.enderecoCompleto(passeio),
    };
    return `https://m.uber.com/looking?pickup=my_location&drop[0]=${encodeURIComponent(JSON.stringify(destino))}`;
  }

  enderecoCompleto(passeio: TourDetail): string {
    const endereco = passeio.address;
    if (!endereco) return passeio.meeting_point;
    const rua = [endereco.street, endereco.number && endereco.number !== 'S/N' ? endereco.number : ''].filter(Boolean).join(', ');
    return [rua, endereco.neighborhood, `${endereco.city} - ${endereco.uf}`, endereco.cep].filter(Boolean).join(', ');
  }

  aoRolarGaleria(trilho: HTMLElement): void {
    this.fotoAtual.set(Math.round(trilho.scrollLeft / Math.max(trilho.clientWidth, 1)));
  }

  avaliar(tourId: number): void {
    if (!this.minhaNota() || this.avaliando()) return;
    this.avaliando.set(true);
    this.tourService.avaliar(tourId, this.minhaNota(), this.meuComentario.trim()).subscribe({
      next: () => {
        this.avaliando.set(false);
        this.minhaNota.set(0);
        this.meuComentario = '';
        this.feedback.sucesso('Obrigado pela avaliação!');
        this.buscarPasseio();
      },
      error: (error: HttpErrorResponse) => {
        this.avaliando.set(false);
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos salvar sua avaliação. Tente de novo.'));
      },
    });
  }

  proximasDatas(datas: TourInstance[]): TourInstance[] {
    const agora = Date.now();
    return datas.filter((data) => new Date(data.start_time).getTime() > agora);
  }

  textoDasVagas(data: TourInstance): string {
    if (data.status === 'CANCELLED') return 'Data cancelada';
    if (!data.open_for_requests) return 'Não está recebendo pedidos';
    const livres = Math.max(data.max_capacity - (data.current_capacity ?? 0), 0);
    return livres === 1 ? '1 vaga livre' : `${livres} vagas livres`;
  }

  podePedirVaga(data: TourInstance): boolean {
    return !this.passeio()?.is_owner && !!data.open_for_requests && !data.my_request_status;
  }

  pedirVaga(data: TourInstance): void {
    this.enviandoPara.set(data.id);
    this.erro.set('');
    this.tourService.solicitarVaga(data.id, '').subscribe({
      next: (resposta) => {
        this.enviandoPara.set(null);
        this.sucesso.set(resposta.status === 'ACCEPTED'
          ? 'Vaga confirmada! O chat do grupo já está aberto em Mensagens.'
          : 'Pedido enviado. O guia tem até 24 horas para responder, e você recebe um aviso.');
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
