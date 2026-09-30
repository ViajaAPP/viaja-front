import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppStore } from '../../shared/store/app.store';
import { ChatMessageService } from '../../shared/services/chat-message/chat-message.service';
import { ChatMessage } from '../../shared/enums/chat.model';
import { NavigationService } from '../../shared/services/navigation';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { mensagemDeErro } from '../../shared/services/request/request-error';

registerLocaleData(localePt, 'pt-BR');

@Component({
  selector: 'app-chat-message',
  imports: [DatePipe, FormsModule, LoadingComponent, FalhaCarregarComponent],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent implements OnInit, OnDestroy {
  private readonly store = inject(AppStore);
  private readonly chatMessageService = inject(ChatMessageService);
  private readonly navigationService = inject(NavigationService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  chatMessage = signal<ChatMessage | null>(null);
  erro = signal('');
  inputText = '';
  currentUserId: number | null = null;
  private chatId: number | null = null;
  private mensagemSubscription?: Subscription;

  private ordenarMensagensParaExibicao(mensagens: ChatMessage['messages_list'] | undefined): ChatMessage['messages_list'] {
    return [...(mensagens ?? [])].reverse();
  }

  ngOnInit(): void {
    const chatId = this.store.selectedChatId();
    this.chatId = chatId ?? null;

    if (!chatId) {
      this.erro.set('Não encontramos essa conversa.');
      return;
    }

    this.mensagemSubscription = this.chatMessageService.onMensagemRecebida.subscribe((mensagem) => {
      const atual = this.chatMessage();
      if (!atual) return;

      this.chatMessage.set({
        ...atual,
        messages_list: [...(atual.messages_list ?? []), mensagem],
      } as ChatMessage);
      this.scrollToBottom();
    });

    this.carregar(chatId);
  }

  tentarDeNovo(): void {
    if (this.chatId === null) return;
    this.erro.set('');
    this.carregar(this.chatId);
  }

  private carregar(chatId: number): void {
    this.chatMessageService.buscarChat(chatId).subscribe({
      next: (data) => {
        try {
          const url = data?.socket_connection_url ?? '';
          const params = new URL(url).searchParams;
          const userIdParam = params.get('user_id');
          this.currentUserId = userIdParam ? Number(userIdParam) : null;
        } catch {
          this.currentUserId = null;
        }

        this.chatMessage.set({
          ...data,
          messages_list: this.ordenarMensagensParaExibicao(data?.messages_list),
        });
        this.scrollToBottom();

        if (data?.socket_connection_url && this.currentUserId !== null) {
          this.chatMessageService.conectarWebSocket(data.socket_connection_url, this.currentUserId);
        }
      },
      error: (error) => this.erro.set(mensagemDeErro(error, 'Não conseguimos abrir essa conversa agora.')),
    });
  }

  enviarMensagem(): void {
    const texto = this.inputText.trim();
    if (!texto || this.chatId === null) return;

    this.chatMessageService.enviarPeloWebSocket(this.chatId, texto);
    this.chatMessageService.enviarMensagem(this.chatId, texto).subscribe();

    const atual = this.chatMessage();
    if (atual && this.currentUserId !== null) {
      const novaMensagem = {
        id: Date.now(),
        chat_id: this.chatId,
        user_id: this.currentUserId,
        text: texto,
        created_at: new Date().toISOString(),
      };
      this.chatMessage.set({
        ...atual,
        messages_list: [...(atual.messages_list ?? []), novaMensagem],
      } as ChatMessage);
    }

    this.inputText = '';
    this.scrollToBottom();
  }

  voltar(): void {
    this.navigationService.navigateTo('chat');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messagesContainer?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    }, 50);
  }

  ngOnDestroy(): void {
    this.chatMessageService.desconectarWebSocket();
    this.mensagemSubscription?.unsubscribe();
  }
}