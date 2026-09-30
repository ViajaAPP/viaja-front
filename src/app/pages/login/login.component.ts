import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation/navigation.service';
import { ApiService } from '../../shared/services/api/api.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { ValidarFormularioDirective } from '../../shared/directives/validar-formulario.directive';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ValidarFormularioDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
})
export class LoginComponent implements OnInit {
  private facade = inject(AppFacade);
  private navigationService = inject(NavigationService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  credentials = {
    email: '',
    password: '',
  };

  isLoggingIn = signal(false);
  errorMessage = signal('');
  senhaVisivel = signal(false);

  login(){
    this.isLoggingIn.set(true);
    this.apiService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoggingIn.set(false);
        this.authService.setToken(response.token);
        this.facade.startSession(response.user_id, response.role);
        this.navigationService.navigateTo('home');
      },
      error: (error) => {
        this.isLoggingIn.set(false);
        this.errorMessage.set(mensagemDeErro(error, 'Não deu pra entrar agora. Confere seu email e senha e tenta de novo.'));
        setTimeout(() => {
          this.errorMessage.set('');
        }, 5000);
      }
    });
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('sessao') === 'expirada') {
      this.errorMessage.set('Sua sessão acabou. Entre de novo para continuar.');
    }
    setTimeout(() => {
    this.facade.setLoading(false);
    }, 100);
  }

  navigateToWelcome(){
    this.navigationService.navigateTo('welcome');
  }

  navigateToRegistrar(){
    this.navigationService.navigateTo('registrar');
  }
}
