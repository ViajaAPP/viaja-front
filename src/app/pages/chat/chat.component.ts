import { Component, inject, OnInit, DestroyRef, signal, computed } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AppFacade } from '../../shared/facade/app.facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
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
  private readonly dados = inject(DadosClienteService);
  private readonly chatData = signal<ChatResponse | null>(null);
  private navigationService = inject(NavigationService);
 
  homeData = signal<HomeResponse | null>(null); 
  groups = computed<ActiveGroup[]>(() => this.chatData()?.tour_list ?? []);
 
  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHeader();
    this.buscarGrupos();
  }
 
  buscarDadosHeader(): void {
    this.dados.getHome().subscribe((data) => {
        this.facade.setLoading(false);
        this.homeData.set(data);
      });
  }
 
  buscarGrupos(): void {
    this.dados.getChatPage().subscribe((data) => {
      this.chatData.set(data);
    });
  }
 
  abrirChat(chatId: number | null, chatOpen?: boolean): void {
    if (!chatOpen) {
      console.warn('Chat fechado, não é possível abrir:', chatId);
      return;
    }

    if (chatId == null) {
      console.warn('Chat inválido, não é possível abrir:', chatId);
      return;
    }

    console.log('<< ABRIR CHAT >>:', chatId);
    this.navigationService.navigateTo('chat-tour', Number(chatId));
  }
}
