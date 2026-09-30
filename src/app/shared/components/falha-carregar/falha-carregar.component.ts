import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-falha-carregar',
  templateUrl: './falha-carregar.component.html',
  styleUrl: './falha-carregar.component.scss',
})
export class FalhaCarregarComponent {
  mensagem = input.required<string>();
  mostrarVoltar = input(false);
  tentar = output<void>();
  voltar = output<void>();
}
