import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { Aviso, AvisosService } from '../../shared/services/avisos/avisos.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';

const ICONES: Record<string, string> = {
  pedido_novo: 'bi-person-plus-fill',
  pedido_aceito: 'bi-check-circle-fill',
  pedido_recusado: 'bi-x-circle',
  data_cancelada: 'bi-calendar-x',
  avaliacao_nova: 'bi-star-fill',
};

@Component({
  selector: 'app-avisos',
  imports: [FalhaCarregarComponent],
  templateUrl: './avisos.component.html',
  styleUrl: './avisos.component.scss',
})
export class AvisosComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);
  private readonly avisosService = inject(AvisosService);

  avisos = signal<Aviso[]>([]);
  carregando = signal(true);
  erro = signal('');

  ngOnInit(): void {
    this.facade.setLoading(false);
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.avisosService.listar().subscribe({
      next: ({ itens, nao_lidas }) => {
        this.avisos.set(itens);
        this.carregando.set(false);
        if (nao_lidas) this.avisosService.marcarTodosComoLidos();
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seus avisos.'));
      },
    });
  }

  icone(aviso: Aviso): string {
    return ICONES[aviso.kind] ?? 'bi-bell-fill';
  }

  quando(data: string): string {
    const minutos = Math.max(Math.round((Date.now() - new Date(data).getTime()) / 60000), 0);
    if (minutos < 1) return 'agora';
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.round(horas / 24);
    return dias === 1 ? 'ontem' : `há ${dias} dias`;
  }

  abrir(aviso: Aviso): void {
    if (aviso.link) this.router.navigateByUrl(aviso.link);
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }
}
