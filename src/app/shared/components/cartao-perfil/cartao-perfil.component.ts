import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cartao-perfil',
  imports: [],
  templateUrl: './cartao-perfil.component.html',
  styleUrl: './cartao-perfil.component.scss',
})
export class CartaoPerfilComponent {
  nome = input('');
  email = input('');
  foto = input('');
  tipoDeConta = input('');
}
