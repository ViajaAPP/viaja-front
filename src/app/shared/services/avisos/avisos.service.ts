import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, filter, tap } from 'rxjs';
import { RequestService } from '../request/request.service';
import { AuthService } from '../auth/auth.service';
import { AppStore } from '../../store/app.store';
import { FeedbackService } from '../feedback/feedback.service';
import { environment } from '../../../../environments/environment';

export interface Aviso {
  id: number;
  created_at: string;
  kind: 'pedido_novo' | 'pedido_aceito' | 'pedido_recusado' | 'data_cancelada' | 'avaliacao_nova' | string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
}

const INTERVALO = 120000;
const ESPERA_PARA_RECONECTAR = 5000;

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly request = inject(RequestService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(AppStore);
  private readonly feedback = inject(FeedbackService);
  private iniciado = false;
  private ultimaConsulta = 0;
  private socket: WebSocket | null = null;
  private tokenDoSocket: string | null = null;

  readonly naoLidas = signal(0);
  readonly pedidosPendentes = signal(0);

  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;
    this.router.events.pipe(filter((evento) => evento instanceof NavigationEnd)).subscribe(() => this.atualizar());
    setInterval(() => this.atualizar(true), INTERVALO);
    this.atualizar(true);
    this.auth.token$.subscribe(() => this.conectar());
  }

  private conectar(): void {
    const token = this.auth.getToken();
    if (token === this.tokenDoSocket && this.socket) return;
    this.socket?.close();
    this.socket = null;
    this.tokenDoSocket = token;
    if (!token) return;
    const socket = new WebSocket(environment.apiUrl.replace(/^http/, 'ws') + '/ws/avisos');
    this.socket = socket;
    socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token }));
    socket.onmessage = (evento) => {
      try {
        const dados = JSON.parse(evento.data);
        if (dados.type !== 'aviso') return;
        this.naoLidas.update((total) => total + 1);
        this.feedback.sucesso(dados.title);
        if (dados.kind === 'pedido_novo') this.atualizar(true);
      } catch {}
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      setTimeout(() => {
        if (!this.socket && this.auth.getToken()) {
          this.tokenDoSocket = null;
          this.conectar();
        }
      }, ESPERA_PARA_RECONECTAR);
    };
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
