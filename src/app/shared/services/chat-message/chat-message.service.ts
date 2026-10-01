import { Injectable, inject, OnDestroy, signal } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { RequestService } from '../request/request.service';
import { AuthService } from '../auth/auth.service';
import { ChatMessage, ChatResponse, MensagensList } from '../../enums/chat.model';
import { APP_CONFIG } from '../../config/app.config';
import { CHAT_MOCK, CHAT_MESSAGE_MOCK } from '../../mock/chat.mock';

@Injectable({ providedIn: 'root' })
export class ChatMessageService implements OnDestroy {
  private readonly request = inject(RequestService);
  private readonly auth = inject(AuthService);

  private webSocket: WebSocket | null = null;
  private urlConectada: string | null = null;
  private chatConectado: number | null = null;
  private tentativas = 0;
  private reconexao?: ReturnType<typeof setTimeout>;
  readonly conexao = signal<'desconectado' | 'conectando' | 'conectado' | 'reconectando'>('desconectado');
  private readonly mensagemRecebida$ = new Subject<MensagensList>();
  private readonly mensagemSalva$ = new Subject<number>();

  get onMensagemSalva(): Observable<number> {
    return this.mensagemSalva$.asObservable();
  }

  get onMensagemRecebida(): Observable<MensagensList> {
    return this.mensagemRecebida$.asObservable();
  }

  buscarPaginaChat(): Observable<ChatResponse> {
    if (APP_CONFIG.MOCK) {
      return of(CHAT_MOCK);
    }
    return this.request.post<ChatResponse>('/pages/chats');
  }

  buscarChat(chatId: number): Observable<ChatMessage> {
    if (APP_CONFIG.MOCK) {
      return of(CHAT_MESSAGE_MOCK);
    }
    return this.request.post<ChatMessage>('/pages/chat', { chat_id: chatId });
  }

  enviarMensagem(chatId: number, conteudo: string): Observable<void> {
    return this.request.post<void>(`/chat/${chatId}/messages`, { content: conteudo });
  }

  enviarPeloWebSocket(chatId: number, texto: string, clientId: number): boolean {
    if (!this.webSocketConectado || this.conexao() !== 'conectado') return false;
    this.webSocket!.send(JSON.stringify({ type: 'message', chat_id: chatId, text: texto, client_id: clientId }));
    return true;
  }

  conectarWebSocket(url: string, chatId: number): void {
    this.desconectarWebSocket();
    this.urlConectada = url;
    this.chatConectado = chatId;
    this.tentativas = 0;
    this.abrirConexao();
  }

  private abrirConexao(): void {
    if (!this.urlConectada) return;

    this.conexao.set(this.tentativas ? 'reconectando' : 'conectando');
    const socket = new WebSocket(this.urlConectada);
    this.webSocket = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', token: this.auth.getToken(), chats: [this.chatConectado] }));
    };

    socket.onmessage = async (event) => {
      try {
        const dados = JSON.parse(await this.normalizarMensagemSocket(event.data));
        if (dados?.type === 'ready') {
          this.tentativas = 0;
          this.conexao.set('conectado');
          return;
        }
        if (dados?.type === 'sent') {
          this.mensagemSalva$.next(Number(dados.client_id));
          return;
        }
        if (dados?.type !== 'message') return;

        const remetenteId = Number(dados.user_id);
        if (!dados.text || !Number.isFinite(remetenteId)) return;

        this.mensagemRecebida$.next({
          id: dados.id ?? Date.now(),
          chat_id: dados.chat_id,
          user_id: remetenteId,
          text: dados.text,
          created_at: dados.created_at ?? new Date().toISOString(),
        });
      } catch {}
    };

    socket.onclose = (event) => {
      if (this.webSocket !== socket) return;
      this.webSocket = null;
      if (event.code === 1008) {
        this.urlConectada = null;
        this.conexao.set('desconectado');
        return;
      }
      this.agendarReconexao();
    };
  }

  private agendarReconexao(): void {
    if (!this.urlConectada) return;
    this.conexao.set('reconectando');
    const espera = Math.min(1000 * 2 ** this.tentativas, 15000);
    this.tentativas++;
    this.reconexao = setTimeout(() => this.abrirConexao(), espera);
  }

  private async normalizarMensagemSocket(data: string | ArrayBuffer | Blob): Promise<string> {
    if (typeof data === 'string') return data;

    if (data instanceof Blob) {
      return await data.text();
    }

    return new TextDecoder().decode(data);
  }

  desconectarWebSocket(): void {
    this.urlConectada = null;
    this.chatConectado = null;
    clearTimeout(this.reconexao);
    this.conexao.set('desconectado');
    if (!this.webSocket) return;
    const socket = this.webSocket;
    this.webSocket = null;
    try {
      socket.close(1000, 'desconectando');
    } catch {}
  }

  get webSocketConectado(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN;
  }

  ngOnDestroy(): void {
    this.desconectarWebSocket();
    this.mensagemRecebida$.complete();
    this.mensagemSalva$.complete();
  }
}