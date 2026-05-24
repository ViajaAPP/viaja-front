import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AppFacade } from '../../shared/facade/app.facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { ChatMessageService } from '../../shared/services/chat-message/chat-message.service';
import { HomeResponse } from '../../shared/enums/home.model';
import { ActiveGroup, ChatResponse } from '../../shared/enums/chat.model';
import { NavigationService } from '../../shared/services/navigation';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  imports: [HeaderComponent],
})
export class ChatComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly dadosClienteService = inject(DadosClienteService);
  private readonly chatMessageService = inject(ChatMessageService);
  private readonly navigationService = inject(NavigationService);

  private readonly chatData = signal<ChatResponse | null>(null);
  homeData = signal<HomeResponse | null>(null);
  groups = computed<ActiveGroup[]>(() => this.chatData()?.tour_list ?? []);

  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHeader();
    this.buscarGrupos();
  }

  buscarDadosHeader(): void {
    this.dadosClienteService.getHome().subscribe((data) => {
      this.facade.setLoading(false);
      this.homeData.set(data);
    });
  }

  buscarGrupos(): void {
    this.chatMessageService.buscarPaginaChat().subscribe((data) => {
      console.log("buscandor: ", data);
      this.chatData.set(data);
    });
  }

  abrirChat(chatId: number | null, chatOpen?: boolean): void {
    if (!chatOpen || chatId == null) return;
    this.navigationService.navigateTo('chat-tour', Number(chatId));
  }
}
