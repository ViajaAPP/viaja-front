import { Component, inject } from '@angular/core';
import { AppFacade } from '../../facade/app.facade';
import { MENSAGEM_SEM_CONEXAO } from '../../services/request/request-error';

@Component({
  selector: 'app-sem-conexao',
  imports: [],
  templateUrl: './sem-conexao.component.html',
  styleUrl: './sem-conexao.component.scss',
})
export class SemConexaoComponent {
  private readonly facade = inject(AppFacade);
  readonly mensagem = MENSAGEM_SEM_CONEXAO;

  tentarDeNovo(): void {
    this.facade.tentarDeNovo();
  }
}
