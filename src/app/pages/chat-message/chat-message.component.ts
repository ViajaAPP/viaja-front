import { Component, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppStore } from '../../shared/store/app.store';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { ChatMessage } from '../../shared/enums/chat.model';

@Component({
  selector: 'app-chat-message',
  imports: [],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent implements OnInit {
  private readonly store = inject(AppStore);
  private readonly dados = inject(DadosClienteService);
  private readonly destroyRef = inject(DestroyRef);

  chatMessage = signal<ChatMessage | null>(null);

  ngOnInit(): void {
    const chatId = this.store.selectedChatId();

    if (!chatId) {
      console.warn('ChatMessageComponent: selectedChatId não está definido');
      return;
    }

    this.dados.getChat(chatId).subscribe((data) => {
        console.log('ChatMessageComponent chat data:', data);
        this.chatMessage.set(data);
      });
  }
}
