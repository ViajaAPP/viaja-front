import { Component, inject, input } from '@angular/core';
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
  passeio = input.required<PasseioEncontrado>();

  formatarPreco(preco: number): string {
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  abrir(): void {
    this.navigationService.navigateToTour('passeio', this.passeio().id);
  }
}
