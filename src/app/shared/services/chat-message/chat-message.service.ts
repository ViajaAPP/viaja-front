import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
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

    console.debug('[ChatMessageService] conectando websocket', { url, usuarioAtualId });
    this.webSocket = new WebSocket(url);

    this.webSocket.onopen = () => {
      console.debug('[ChatMessageService] websocket conectado', { url, usuarioAtualId });
    };

    this.webSocket.onerror = (event) => {
      console.error('[ChatMessageService] websocket com erro', { url, usuarioAtualId, event });
    };

    this.webSocket.onmessage = async (event) => {
      try {
        console.log('[ChatMessageService] websocket mensagem recebida', { url, usuarioAtualId, eventData: event.data });
        const bruto = await this.normalizarMensagemSocket(event.data);
        console.debug('[ChatMessageService] websocket mensagem bruta', bruto);

        const dados = JSON.parse(bruto);

        const payload = dados?.payload ?? dados?.data ?? dados?.message ?? dados;
        const remetenteId = Number(payload?.user_id ?? dados?.user_id);
        const texto = payload?.text ?? payload?.content ?? dados?.text ?? dados?.content ?? '';

        if (!texto) return;
        if (!Number.isFinite(remetenteId)) return;

        const mensagem: MensagensList = {
          id: Date.now(),
          chat_id: dados.chat_id,
          user_id: remetenteId,
          text: texto,
          created_at: new Date().toISOString(),
        };

        console.debug('[ChatMessageService] websocket mensagem emitida', mensagem);
        this.mensagemRecebida$.next(mensagem);
      } catch (error) {
        console.error('[ChatMessageService] falha ao processar mensagem do websocket', { error, eventData: event.data });
      }
    };

    this.webSocket.onclose = () => {
      console.debug('[ChatMessageService] websocket desconectado', { url, usuarioAtualId });
      this.webSocket = null;
    };
  }

  private async normalizarMensagemSocket(data: string | ArrayBuffer | Blob): Promise<string> {
    if (typeof data === 'string') return data;

    if (data instanceof Blob) {
      return await data.text();
    }

    return new TextDecoder().decode(data);
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