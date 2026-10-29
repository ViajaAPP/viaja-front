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
import { FormsModule } from '@angular/forms';
import { PapelService } from '../../shared/services/papel/papel.service';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { PedidoDePapel, UserRole } from '../../shared/enums/user.model';
import { forkJoin } from 'rxjs';

const PAPEIS_EXTRAS: Partial<Record<UserRole, { role: UserRole; titulo: string; nome: string; icone: string }>> = {
  GUIDE: { role: 'EVENT_PROMOTER', titulo: 'Também organizo eventos', nome: 'produtor de eventos', icone: 'bi-calendar-event' },
  EVENT_PROMOTER: { role: 'GUIDE', titulo: 'Também guio passeios', nome: 'guia de turismo', icone: 'bi-compass' },
};

@Component({
  selector: 'app-perfil',
  imports: [CartaoPerfilComponent, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly authService = inject(AuthService);
  private readonly dadosClienteService = inject(DadosClienteService);
  private readonly eventoService = inject(EventoService);
  private readonly papelService = inject(PapelService);
  private readonly feedback = inject(FeedbackService);

  perfil = signal<Perfil | null>(null);
  erro = signal('');
  eventosEmAnalise = signal(0);
  pedidoDePapel = signal<PedidoDePapel | null>(null);
  pedindoPapel = signal(false);
  cnpjExtra = '';
  papelExtra = computed(() => PAPEIS_EXTRAS[this.facade.myRole() ?? 'TOURIST'] ?? null);
  podePedirPapel = computed(() => !this.pedidoDePapel() || this.pedidoDePapel()!.status === 'REJECTED');
  statusDoPapel = computed(() => {
    const pedido = this.pedidoDePapel();
    if (!pedido) return 'Peça o papel com o seu CNPJ e a equipe analisa';
    if (pedido.status === 'APPROVED') return 'Aprovado. As opções novas já aparecem no app';
    if (pedido.status === 'PENDING') return 'Pedido enviado, esperando a análise da equipe';
    return pedido.review_note ? `Precisa de ajustes: ${pedido.review_note}` : 'Precisa de ajustes. Confira o CNPJ e peça de novo';
  });
  tipoDeConta = computed(() => {
    const role = this.perfil()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  ngOnInit(): void {
    if (this.facade.myRole() === 'ADMIN') {
      forkJoin([this.eventoService.paraAnalise(), this.papelService.paraAnalise()]).subscribe({
        next: ([eventos, papeis]) => this.eventosEmAnalise.set(eventos.length + papeis.length),
        error: () => {},
      });
    }
    if (this.papelExtra()) this.carregarPapeis();
    this.dadosClienteService.getPerfil().subscribe({
      next: (perfil) => this.perfil.set(perfil),
      error: (error: HttpErrorResponse) =>
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seu perfil.')),
    });
  }

  private carregarPapeis(): void {
    const papel = this.papelExtra()?.role;
    this.papelService.meus().subscribe({
      next: ({ pedidos, aprovados }) => {
        this.pedidoDePapel.set(pedidos.find((pedido) => pedido.role === papel) ?? null);
        this.facade.setExtraRoles(aprovados);
      },
      error: () => {},
    });
  }

  pedirPapel(role: UserRole): void {
    if (this.pedindoPapel()) return;
    this.pedindoPapel.set(true);
    this.papelService.pedir(role, this.cnpjExtra.trim()).subscribe({
      next: (pedido) => {
        this.pedindoPapel.set(false);
        this.pedidoDePapel.set(pedido);
        this.cnpjExtra = '';
        this.feedback.sucesso('Pedido enviado. A gente avisa quando for analisado.');
      },
      error: (error: HttpErrorResponse) => {
        this.pedindoPapel.set(false);
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos enviar seu pedido. Tente de novo.'));
      },
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
