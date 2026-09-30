import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, filter, tap } from 'rxjs';
import { RequestService } from '../request/request.service';
import { AuthService } from '../auth/auth.service';
import { AppStore } from '../../store/app.store';

export interface Aviso {
  id: number;
  created_at: string;
  kind: 'pedido_novo' | 'pedido_aceito' | 'pedido_recusado' | 'data_cancelada' | 'avaliacao_nova' | string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
}

const INTERVALO = 45000;

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly request = inject(RequestService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(AppStore);
  private iniciado = false;
  private ultimaConsulta = 0;

  readonly naoLidas = signal(0);
  readonly pedidosPendentes = signal(0);

  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;
    this.router.events.pipe(filter((evento) => evento instanceof NavigationEnd)).subscribe(() => this.atualizar());
    setInterval(() => this.atualizar(true), INTERVALO);
    this.atualizar(true);
  }

  atualizar(forcar = false): void {
    if (!this.auth.getToken()) {
      this.naoLidas.set(0);
      return;
    }
    if (!forcar && Date.now() - this.ultimaConsulta < 10000) return;
    this.ultimaConsulta = Date.now();
    this.request.get<{ nao_lidas: number }>('/avisos/contagem').subscribe({
      next: ({ nao_lidas }) => this.naoLidas.set(nao_lidas),
      error: () => {},
    });
    if (this.store.myRole() === 'GUIDE') {
      this.request.get<{ pendentes: number }>('/painel/contagem').subscribe({
        next: ({ pendentes }) => this.pedidosPendentes.set(pendentes),
        error: () => {},
      });
    } else {
      this.pedidosPendentes.set(0);
    }
  }

  listar(): Observable<{ itens: Aviso[]; nao_lidas: number }> {
    return this.request.get<{ itens: Aviso[]; nao_lidas: number }>('/avisos/').pipe(
      tap(({ nao_lidas }) => this.naoLidas.set(nao_lidas)),
    );
  }

  marcarTodosComoLidos(): void {
    this.request.post('/avisos/lidas', {}).subscribe({ next: () => this.naoLidas.set(0), error: () => {} });
  }
}
