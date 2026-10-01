import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { EventoService } from '../../shared/services/evento/evento.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { Evento } from '../../shared/enums/evento.model';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { EventosGestaoComponent } from '../../shared/components/eventos-gestao/eventos-gestao.component';

@Component({
  selector: 'app-meus-eventos',
  imports: [FalhaCarregarComponent, EventosGestaoComponent],
  templateUrl: './meus-eventos.component.html',
  styleUrls: ['../painel/painel.component.scss', './meus-eventos.component.scss'],
})
export class MeusEventosComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly eventoService = inject(EventoService);

  readonly mostrarVoltar = !this.facade.isPromoter();
  eventos = signal<Evento[]>([]);
  carregando = signal(true);
  erro = signal('');

  ativos = computed(() => this.eventos().filter((evento) => !this.jaPassou(evento)).reverse());
  antigos = computed(() => this.eventos().filter((evento) => this.jaPassou(evento)));

  ngOnInit(): void {
    this.facade.setLoading(false);
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.eventoService.meus().subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
        this.carregando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seus eventos.'));
      },
    });
  }

  novo(): void {
    this.navigationService.navigateTo('evento-form');
  }

  voltar(): void {
    this.navigationService.voltar('perfil');
  }

  private jaPassou(evento: Evento): boolean {
    return evento.status === 'CANCELLED' || evento.status === 'DONE' || new Date(evento.end_time ?? evento.start_time).getTime() < Date.now();
  }
}
