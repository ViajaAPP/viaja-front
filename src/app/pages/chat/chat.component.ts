import { Component, inject, OnInit, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AppFacade } from '../../shared/facade/app.facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { HomeResponse } from '../../shared/enums/home.model';
import { ActiveGroup, ChatResponse } from '../../shared/enums/chat.model';
import { CHAT_MOCK } from '../../shared/mock/chat.mock';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly chatData = signal<ChatResponse | null>(null);
  private navigationService = inject(NavigationService);
 
  homeData = signal<HomeResponse | null>(null); 
  groups = computed<ActiveGroup[]>(() => this.chatData()?.activeGroups ?? []);
 
  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHeader();
    this.buscarGrupos();
  }
 
  buscarDadosHeader(): void {
    this.dados
      .getHome().subscribe((data) => {
        this.facade.setLoading(false);
        this.homeData.set(data);
      });
  }
 
  buscarGrupos(): void {
    this.dados.getChatPage().subscribe((data) => {
      this.chatData.set(data);
    });
  }
 
  abrirChat(chatId: number): void {
    console.log('<< ABRIR CHAT >>:', chatId);
    this.navigationService.navigateTo('chat-tour', Number(chatId));
  }
}
