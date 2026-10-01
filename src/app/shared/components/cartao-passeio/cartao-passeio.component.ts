import { Component, computed, inject, input } from '@angular/core';
import { AppFacade } from '../../facade';
import { DatePipe } from '@angular/common';
import { NavigationService } from '../../services/navigation';
import { PasseioEncontrado } from '../../services/busca/busca.service';
import { PRICE_FORMAT } from '../../config/tour.config';
import { BotaoFavoritoComponent } from '../botao-favorito/botao-favorito.component';

@Component({
  selector: 'app-cartao-passeio',
  imports: [DatePipe, BotaoFavoritoComponent],
  templateUrl: './cartao-passeio.component.html',
  styleUrl: './cartao-passeio.component.scss',
})
export class CartaoPasseioComponent {
  private readonly navigationService = inject(NavigationService);
  private readonly facade = inject(AppFacade);
  passeio = input.required<PasseioEncontrado>();
  readonly logado = computed(() => !!this.facade.myRole());

  formatarPreco(preco: number): string {
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  abrir(): void {
    this.navigationService.navigateToTour('passeio', this.passeio().id);
  }
}
