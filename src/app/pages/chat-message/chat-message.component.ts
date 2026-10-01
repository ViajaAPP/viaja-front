import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppStore } from '../../shared/store/app.store';
import { ChatMessageService } from '../../shared/services/chat-message/chat-message.service';
import { ChatMessage, MensagensList } from '../../shared/enums/chat.model';
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
  readonly currentUserId = this.store.myUserId();
  readonly conexao = this.chatMessageService.conexao;
  readonly nomes = computed(() => {
    const nomes = new Map<number, string>();
    for (const pessoa of this.chatMessage()?.user_list ?? []) {
      if (pessoa.user_id) nomes.set(pessoa.user_id, pessoa.first_name ?? '');
    }
    return nomes;
  });
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
      if (mensagem.user_id !== this.currentUserId) this.adicionar(mensagem);
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
        this.chatMessage.set({
          ...data,
          messages_list: this.ordenarMensagensParaExibicao(data?.messages_list),
        });
        this.scrollToBottom();

        if (data?.socket_connection_url) {
          this.chatMessageService.conectarWebSocket(data.socket_connection_url, chatId);
        }
      },
      error: (error) => {
        if (this.conversaDeOutraPessoa(error)) return this.voltar();
        this.erro.set(mensagemDeErro(error, 'Não conseguimos abrir essa conversa agora.'));
      },
    });
  }

  mostrarNome(indice: number): boolean {
    const mensagens = this.chatMessage()?.messages_list ?? [];
    const mensagem = mensagens[indice];
    if (!mensagem || mensagem.user_id === this.currentUserId) return false;
    return indice === 0 || mensagens[indice - 1].user_id !== mensagem.user_id;
  }

  enviarMensagem(): void {
    const texto = this.inputText.trim();
    if (!texto || this.chatId === null || this.currentUserId === null) return;

    const mensagem: MensagensList = {
      id: Date.now(),
      chat_id: this.chatId,
      user_id: this.currentUserId,
      text: texto,
      created_at: new Date().toISOString(),
      estado: 'enviando',
    };
    this.adicionar(mensagem);
    this.inputText = '';
    this.enviar(mensagem);
  }

  reenviar(mensagem: MensagensList): void {
    this.atualizar(mensagem.id, 'enviando');
    this.enviar(mensagem);
  }

  private enviar(mensagem: MensagensList): void {
    const chatId = this.chatId;
    if (chatId === null) return;

    this.chatMessageService.enviarMensagem(chatId, mensagem.text).subscribe({
      next: () => this.atualizar(mensagem.id, undefined),
      error: (error) => {
        if (this.conversaDeOutraPessoa(error)) return this.voltar();
        this.atualizar(mensagem.id, 'falhou');
      },
    });
  }

  private adicionar(mensagem: MensagensList): void {
    const atual = this.chatMessage();
    if (!atual) return;
    this.chatMessage.set({ ...atual, messages_list: [...(atual.messages_list ?? []), mensagem] });
    this.scrollToBottom();
  }

  private atualizar(id: number, estado: MensagensList['estado']): void {
    const atual = this.chatMessage();
    if (!atual) return;
    this.chatMessage.set({
      ...atual,
      messages_list: atual.messages_list.map((m) => (m.id === id ? { ...m, estado } : m)),
    });
  }

  private conversaDeOutraPessoa(error: HttpErrorResponse): boolean {
    return error.status === 403 || error.status === 404;
  }

  voltar(): void {
    this.navigationService.voltar('chat');
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
