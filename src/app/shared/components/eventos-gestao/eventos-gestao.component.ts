import { Component, inject, input } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { NavigationService } from '../../services/navigation';
import { EVENTO_STATUS_LABELS, Evento } from '../../enums/evento.model';

registerLocaleData(localePt, 'pt-BR');

@Component({
  selector: 'app-eventos-gestao',
  imports: [DatePipe],
  templateUrl: './eventos-gestao.component.html',
  styleUrls: ['../../../pages/painel/painel.component.scss', './eventos-gestao.component.scss'],
})
export class EventosGestaoComponent {
  private readonly navigationService = inject(NavigationService);

  eventos = input<Evento[]>([]);
  readonly rotulos = EVENTO_STATUS_LABELS;

  ver(evento: Evento): void {
    this.navigationService.navigateToTour('evento', evento.id);
  }

  editar(evento: Evento): void {
    this.navigationService.navigateToTour('evento-form', evento.id);
  }

  novo(): void {
    this.navigationService.navigateTo('evento-form');
  }

  podeEditar(evento: Evento): boolean {
    return evento.status !== 'CANCELLED' && evento.status !== 'DONE' && new Date(evento.start_time).getTime() > Date.now();
  }
}
