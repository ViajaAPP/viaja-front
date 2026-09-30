import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FavoritoService } from '../../services/favorito/favorito.service';
import { DadosClienteService } from '../../services/dados-cliente/dados-cliente.service';

@Component({
  selector: 'app-botao-favorito',
  imports: [],
  templateUrl: './botao-favorito.component.html',
  styleUrl: './botao-favorito.component.scss',
})
export class BotaoFavoritoComponent {
  private readonly favoritoService = inject(FavoritoService);
  private readonly dadosCliente = inject(DadosClienteService);

  tourId = input.required<number | string>();
  titulo = input('');
  favorito = input(false);
  alterado = output<boolean>();

  ativo = linkedSignal(() => this.favorito());
  enviando = signal(false);

  alternar(event: Event): void {
    event.stopPropagation();
    if (this.enviando()) return;

    const novoEstado = !this.ativo();
    const id = Number(this.tourId());
    this.ativo.set(novoEstado);
    this.enviando.set(true);

    const pedido = novoEstado ? this.favoritoService.favoritar(id) : this.favoritoService.desfavoritar(id);
    pedido.subscribe({
      next: () => {
        this.enviando.set(false);
        this.dadosCliente.limparCache();
        this.alterado.emit(novoEstado);
      },
      error: () => {
        this.enviando.set(false);
        this.ativo.set(!novoEstado);
      },
    });
  }
}
