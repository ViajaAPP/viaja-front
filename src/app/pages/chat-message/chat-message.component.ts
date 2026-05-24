import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../shared/store/app.store';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { ChatMessage } from '../../shared/enums/chat.model';
import { NavigationService } from '../../shared/services/navigation';

@Component({
  selector: 'app-chat-message',
  imports: [DatePipe, FormsModule],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent implements OnInit, OnDestroy {
  private readonly store = inject(AppStore);
  private readonly dados = inject(DadosClienteService);
  private navigationService = inject(NavigationService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  chatMessage = signal<ChatMessage | null>(null);
  inputText = '';
  currentUserId: number | null = null;
  private chatId: number | null = null;

  private ws: WebSocket | null = null;

  ngOnInit(): void {
    const chatId = this.store.selectedChatId();
    this.chatId = chatId ?? null;

    if (!chatId) {
      console.warn('ChatMessageComponent: selectedChatId não está definido');
      return;
    }

    this.dados.getChat(chatId).subscribe((data) => {
      console.log('ChatMessageComponent chat data:', data);

      // Extrai o user_id logado da URL do socket
      try {
        const url = data?.socket_connection_url ?? '';
        const params = new URL(url).searchParams;
        const userIdStr = params.get('user_id');
        this.currentUserId = userIdStr ? Number(userIdStr) : null;
      } catch {
        this.currentUserId = null;
      }

      this.chatMessage.set(data);
      this.scrollToBottom();

      if (data?.socket_connection_url) {
        this.initWebSocket(data.socket_connection_url);
      }
    });
  }

  enviarMensagem(): void {
    const text = this.inputText.trim();
    if (!text || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({
      chat_id: this.chatId,
      text,
    });

    this.ws.send(payload);

    if (this.chatId !== null) {
      this.dados.sendMessage(this.chatId, text).subscribe({
        error: (err) => console.error('Erro ao salvar mensagem:', err),
      });
    }

    const current = this.chatMessage();
    if (current && this.currentUserId !== null) {
      const novaMsg = {
        user_id: this.currentUserId,
        message_id: Date.now(),
        content: text,
        send_date: new Date().toISOString(),
      };
      this.chatMessage.set({
        ...current,
        messages_list: [...(current.messages_list ?? []), novaMsg],
      } as ChatMessage);
    }

    this.inputText = '';
    this.scrollToBottom();
  }

  private initWebSocket(url: string): void {
    if (this.ws) {
      try { this.ws.close(); } catch { /* noop */ }
      this.ws = null;
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => console.log('WebSocket conectado');

    this.ws.onclose = (ev) => {
      console.log('WebSocket fechado', ev.code, ev.reason);
      this.ws = null;
    };

    this.ws.onerror = (err) => console.error('WebSocket erro:', err);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('WS mensagem recebida:', msg);

        if (msg?.type === 'message') {
          const incomingUserId = Number(msg.user_id ?? msg.payload?.user_id);

          // Ignora eco das próprias mensagens
          if (incomingUserId === this.currentUserId) return;

          const payload = {
            user_id: incomingUserId,
            message_id: Date.now(),
            content: msg.text ?? msg.payload?.text ?? msg.content ?? '',
            send_date: new Date().toISOString(),
          };

          const current = this.chatMessage();
          if (current) {
            this.chatMessage.set({
              ...current,
              messages_list: [...(current.messages_list ?? []), payload],
            } as ChatMessage);
            this.scrollToBottom();
          }
        }
      } catch (e) {
        console.error('Erro ao parsear mensagem WS:', e);
      }
    };
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  voltar(){
    console.log('<< VOLTAR PARA LISTA DE CHATS >>');
    this.navigationService.navigateTo('chat');
  }

  ngOnDestroy(): void {
    if (this.ws) {
      try { this.ws.close(1000, 'desconectando'); } catch { /* noop */ }
      this.ws = null;
    }
  }
}