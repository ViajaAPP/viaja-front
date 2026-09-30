import { Injectable, inject, OnDestroy, signal } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { RequestService } from '../request/request.service';
import { ChatMessage, ChatResponse, MensagensList } from '../../enums/chat.model';
import { APP_CONFIG } from '../../config/app.config';
import { CHAT_MOCK, CHAT_MESSAGE_MOCK } from '../../mock/chat.mock';

@Injectable({ providedIn: 'root' })
export class ChatMessageService implements OnDestroy {
  private readonly request = inject(RequestService);

  private webSocket: WebSocket | null = null;
  private urlConectada: string | null = null;
  private tentativas = 0;
  private reconexao?: ReturnType<typeof setTimeout>;
  readonly conexao = signal<'desconectado' | 'conectando' | 'conectado' | 'reconectando'>('desconectado');
  private readonly mensagemRecebida$ = new Subject<MensagensList>();

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

  enviarPeloWebSocket(chatId: number, texto: string): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({ chat_id: chatId, text: texto });
    this.webSocket.send(payload);
  }

  conectarWebSocket(url: string): void {
    this.desconectarWebSocket();
    this.urlConectada = url;
    this.tentativas = 0;
    this.abrirConexao();
  }

  private abrirConexao(): void {
    if (!this.urlConectada) return;

    this.conexao.set(this.tentativas ? 'reconectando' : 'conectando');
    const socket = new WebSocket(this.urlConectada);
    this.webSocket = socket;

    socket.onopen = () => {
      this.tentativas = 0;
      this.conexao.set('conectado');
    };

    socket.onmessage = async (event) => {
      try {
        const dados = JSON.parse(await this.normalizarMensagemSocket(event.data));
        const payload = dados?.payload ?? dados?.data ?? dados?.message ?? dados;
        const remetenteId = Number(payload?.user_id ?? dados?.user_id);
        const texto = payload?.text ?? payload?.content ?? dados?.text ?? dados?.content ?? '';

        if (!texto || !Number.isFinite(remetenteId)) return;

        this.mensagemRecebida$.next({
          id: Date.now(),
          chat_id: dados.chat_id,
          user_id: remetenteId,
          text: texto,
          created_at: new Date().toISOString(),
        });
      } catch {}
    };

    socket.onclose = () => {
      if (this.webSocket !== socket) return;
      this.webSocket = null;
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
  }
}