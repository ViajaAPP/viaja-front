import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { EventoService } from '../../shared/services/evento/evento.service';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { MapaComponent } from '../../shared/components/mapa/mapa.component';
import { Evento } from '../../shared/enums/evento.model';
import { PRICE_FORMAT } from '../../shared/config/tour.config';
import { linkDoMaps, linkDoUber } from '../../shared/config/mapas.config';

registerLocaleData(localePt, 'pt-BR');

@Component({
  selector: 'app-evento',
  imports: [DatePipe, MapaComponent],
  templateUrl: './evento.component.html',
  styleUrls: ['../passeio/passeio.component.scss', './evento.component.scss'],
})
export class EventoComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly eventoService = inject(EventoService);
  private readonly feedback = inject(FeedbackService);

  evento = signal<Evento | null>(null);
  erro = signal('');
  salvando = signal(false);

  encerrado = computed(() => {
    const evento = this.evento();
    if (!evento) return false;
    return new Date(evento.end_time ?? evento.start_time).getTime() < Date.now();
  });

  vagasLivres = computed(() => {
    const evento = this.evento();
    if (!evento?.capacity) return null;
    return Math.max(evento.capacity - evento.going_count, 0);
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    const id = this.facade.selectedTourId();
    if (!id) return;
    this.eventoService.buscar(id).subscribe({
      next: (evento) => this.evento.set(evento),
      error: (error: HttpErrorResponse) => this.erro.set(mensagemDeErro(error, 'Não encontramos esse evento.')),
    });
  }

  formatarPreco(preco: number): string {
    return preco > 0 ? `${PRICE_FORMAT.format(preco)} por pessoa` : 'Entrada gratuita';
  }

  enderecoCompleto(evento: Evento): string {
    const endereco = evento.address;
    if (!endereco) return evento.place_name ?? '';
    const rua = [endereco.street, endereco.number && endereco.number !== 'S/N' ? endereco.number : ''].filter(Boolean).join(', ');
    return [rua, endereco.neighborhood, `${endereco.city} - ${endereco.uf}`].filter(Boolean).join(', ');
  }

  linkDoMaps(evento: Evento): string {
    return linkDoMaps(evento.address?.lat, evento.address?.lon);
  }

  linkDoUber(evento: Evento): string {
    return linkDoUber(evento.address?.lat, evento.address?.lon, evento.place_name || evento.title, this.enderecoCompleto(evento));
  }

  textoDeQuemVai(evento: Evento): string {
    const outros = evento.going ? evento.going_count - 1 : evento.going_count;
    if (evento.going) return outros ? `Você e mais ${outros} ${outros === 1 ? 'pessoa vão' : 'pessoas vão'}` : 'Por enquanto só você confirmou';
    if (!evento.going_count) return 'Ninguém confirmou ainda. Seja a primeira pessoa!';
    return evento.going_count === 1 ? '1 pessoa vai' : `${evento.going_count} pessoas vão`;
  }

  marcarPresenca(vou: boolean): void {
    const evento = this.evento();
    if (!evento || this.salvando()) return;
    this.salvando.set(true);
    this.eventoService.marcarPresenca(evento.id, vou).subscribe({
      next: () => {
        this.salvando.set(false);
        this.feedback.sucesso(vou ? 'Combinado! O evento já está nas suas reservas.' : 'Tudo bem, tiramos você da lista.');
        this.carregar();
      },
      error: (error: HttpErrorResponse) => {
        this.salvando.set(false);
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos salvar agora. Tente de novo.'));
      },
    });
  }

  editar(): void {
    const evento = this.evento();
    if (evento) this.navigationService.navigateToTour('evento-form', evento.id);
  }

  async cancelar(): Promise<void> {
    const evento = this.evento();
    if (!evento) return;
    const confirmou = await this.feedback.confirmar({
      titulo: 'Cancelar esse evento?',
      texto: evento.going_count
        ? `${evento.going_count === 1 ? 'A pessoa que confirmou recebe' : `As ${evento.going_count} pessoas que confirmaram recebem`} um aviso na hora.`
        : 'Ele sai do ar e não dá para desfazer.',
      confirmar: 'Cancelar evento',
      perigo: true,
    });
    if (!confirmou) return;
    this.eventoService.cancelar(evento.id).subscribe({
      next: () => {
        this.feedback.sucesso('Evento cancelado.');
        this.carregar();
      },
      error: (error: HttpErrorResponse) => this.feedback.erro(mensagemDeErro(error, 'Não conseguimos cancelar agora.')),
    });
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }
}
