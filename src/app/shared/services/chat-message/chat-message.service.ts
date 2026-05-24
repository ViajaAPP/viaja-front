import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, of, Subject, tap } from 'rxjs';
import { RequestService } from '../request/request.service';
import { ChatMessage, ChatResponse, MensagensList } from '../../enums/chat.model';
import { APP_CONFIG } from '../../config/app.config';
import { CHAT_MOCK, CHAT_MESSAGE_MOCK } from '../../mock/chat.mock';

@Injectable({ providedIn: 'root' })
export class ChatMessageService implements OnDestroy {
  private readonly request = inject(RequestService);

  private webSocket: WebSocket | null = null;
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

  conectarWebSocket(url: string, usuarioAtualId: number): void {
    this.desconectarWebSocket();

    this.webSocket = new WebSocket(url);

    this.webSocket.onmessage = (event) => {
      try {
        const dados = JSON.parse(event.data);

        if (dados?.type !== 'message') return;

        const remetenteId = Number(dados.user_id ?? dados.payload?.user_id);
        if (remetenteId === usuarioAtualId) return;

        const mensagem: MensagensList = {
          id: Date.now(),
          chat_id: dados.chat_id,
          user_id: remetenteId,
          text: dados.text ?? dados.payload?.text ?? dados.content ?? '',
          created_at: new Date().toISOString(),
        };

        this.mensagemRecebida$.next(mensagem);
      } catch {}
    };

    this.webSocket.onclose = () => {
      this.webSocket = null;
    };
  }

  desconectarWebSocket(): void {
    if (!this.webSocket) return;
    try {
      this.webSocket.close(1000, 'desconectando');
    } catch {}
    this.webSocket = null;
  }

  get webSocketConectado(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN;
  }

  ngOnDestroy(): void {
    this.desconectarWebSocket();
    this.mensagemRecebida$.complete();
  }
}