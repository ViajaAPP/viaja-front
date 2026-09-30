import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { ApiService } from '../../shared/services/api/api.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { ValidarFormularioDirective } from '../../shared/directives/validar-formulario.directive';

@Component({
  selector: 'app-redefinir-senha',
  imports: [FormsModule, ValidarFormularioDirective],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: '../registrar/registrar.component.scss',
})
export class RedefinirSenhaComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly apiService = inject(ApiService);
  readonly codigo = inject(ActivatedRoute).snapshot.queryParamMap.get('codigo') ?? '';

  senha = '';
  confirmacao = '';
  senhaVisivel = signal(false);
  salvando = signal(false);
  trocou = signal(false);
  erro = signal(this.codigo ? '' : 'Esse link está incompleto. Peça um novo na tela de entrar.');

  ngOnInit(): void {
    this.facade.setLoading(false);
  }

  trocarSenha(): void {
    if (this.senha !== this.confirmacao) {
      this.erro.set('As duas senhas precisam ser iguais.');
      return;
    }
    this.salvando.set(true);
    this.erro.set('');
    this.apiService.redefinirSenha(this.codigo, this.senha).subscribe({
      next: () => {
        this.salvando.set(false);
        this.trocou.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos trocar a senha agora. Tente de novo.'));
      },
    });
  }

  pedirOutroLink(): void {
    this.navigationService.navigateTo('esqueci-senha');
  }

  irParaLogin(): void {
    this.navigationService.navigateTo('login');
  }
}
