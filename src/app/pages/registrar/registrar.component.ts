import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { ApiService, RegisterRequest } from '../../shared/services/api/api.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { UserRole } from '../../shared/enums/user.model';
import { ROLE_LABELS } from '../../shared/config/tour.config';

@Component({
  selector: 'app-registrar',
  imports: [FormsModule],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  readonly tiposDeConta: { role: UserRole; label: string }[] = [
    { role: 'TOURIST', label: ROLE_LABELS.TOURIST },
    { role: 'GUIDE', label: ROLE_LABELS.GUIDE },
  ];

  cadastro: RegisterRequest = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    photo: '',
    role: 'TOURIST',
    cnpj: '',
  };

  enviando = signal(false);
  erro = signal('');

  ngOnInit(): void {
    this.facade.setLoading(false);
  }

  pedeCnpj(): boolean {
    return this.cadastro.role !== 'TOURIST';
  }

  cadastrar(): void {
    this.enviando.set(true);
    this.erro.set('');
    const credenciais = { email: this.cadastro.email, password: this.cadastro.password };

    this.apiService
      .register(this.cadastro)
      .pipe(switchMap(() => this.apiService.login(credenciais)))
      .subscribe({
        next: (response) => {
          this.authService.setToken(response.token);
          this.facade.startSession(response.user_id, response.role);
          this.navigationService.navigateTo('home');
        },
        error: (error: HttpErrorResponse) => {
          this.enviando.set(false);
          this.erro.set(mensagemDeErro(error, 'Não conseguimos criar sua conta. Tente de novo.'));
        },
      });
  }

  irParaLogin(): void {
    this.navigationService.navigateTo('login');
  }

  voltar(): void {
    this.navigationService.navigateTo('welcome');
  }
}
