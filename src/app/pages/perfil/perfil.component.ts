import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { AuthService } from '../../shared/services/auth/auth.service';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { Perfil } from '../../shared/enums/user.model';
import { ROLE_LABELS } from '../../shared/config/tour.config';
import { EventoService } from '../../shared/services/evento/evento.service';
import { CartaoPerfilComponent } from '../../shared/components/cartao-perfil/cartao-perfil.component';

@Component({
  selector: 'app-perfil',
  imports: [CartaoPerfilComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly authService = inject(AuthService);
  private readonly dadosClienteService = inject(DadosClienteService);
  private readonly eventoService = inject(EventoService);

  perfil = signal<Perfil | null>(null);
  erro = signal('');
  eventosEmAnalise = signal(0);
  tipoDeConta = computed(() => {
    const role = this.perfil()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  ngOnInit(): void {
    if (this.facade.myRole() === 'ADMIN') {
      this.eventoService.paraAnalise().subscribe({ next: (eventos) => this.eventosEmAnalise.set(eventos.length), error: () => {} });
    }
    this.dadosClienteService.getPerfil().subscribe({
      next: (perfil) => this.perfil.set(perfil),
      error: (error: HttpErrorResponse) =>
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seu perfil.')),
    });
  }

  editarPerfil(): void {
    this.navigationService.navigateTo('perfil-editar');
  }

  abrirMeusPasseios(): void {
    this.navigationService.navigateTo('meus-passeios');
  }

  abrirAnalise(): void {
    this.navigationService.navigateTo('analise');
  }

  abrirAvisos(): void {
    this.navigationService.navigateTo('avisos');
  }

  abrirPerfilPublico(): void {
    this.navigationService.abrirPerfil(this.facade.myUserId());
  }

  abrirFavoritos(): void {
    this.navigationService.navigateTo('favoritos');
  }

  abrirMinhasSolicitacoes(): void {
    this.navigationService.navigateTo('minhas-solicitacoes');
  }

  sair(): void {
    this.authService.sair();
    this.dadosClienteService.limparCache();
    this.facade.endSession();
  }
}
