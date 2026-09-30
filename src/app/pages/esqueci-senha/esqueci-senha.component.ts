import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { ApiService } from '../../shared/services/api/api.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { ValidarFormularioDirective } from '../../shared/directives/validar-formulario.directive';

@Component({
  selector: 'app-esqueci-senha',
  imports: [FormsModule, ValidarFormularioDirective],
  templateUrl: './esqueci-senha.component.html',
  styleUrl: '../registrar/registrar.component.scss',
})
export class EsqueciSenhaComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly apiService = inject(ApiService);

  email = '';
  enviando = signal(false);
  enviado = signal('');
  erro = signal('');

  ngOnInit(): void {
    this.facade.setLoading(false);
  }

  pedirLink(): void {
    this.enviando.set(true);
    this.erro.set('');
    this.apiService.esqueciSenha(this.email.trim()).subscribe({
      next: ({ message }) => {
        this.enviando.set(false);
        this.enviado.set(message);
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos mandar o email agora. Tente de novo.'));
      },
    });
  }

  voltar(): void {
    this.navigationService.navigateTo('login');
  }
}
