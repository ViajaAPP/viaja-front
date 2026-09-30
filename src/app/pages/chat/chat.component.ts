import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AppFacade } from '../../shared/facade/app.facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { ChatMessageService } from '../../shared/services/chat-message/chat-message.service';
import { HomeResponse } from '../../shared/enums/home.model';
import { ActiveGroup, ChatResponse } from '../../shared/enums/chat.model';
import { NavigationService } from '../../shared/services/navigation';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { mensagemDeErro } from '../../shared/services/request/request-error';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  imports: [HeaderComponent, FalhaCarregarComponent],
})
export class ChatComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly dadosClienteService = inject(DadosClienteService);
  private readonly chatMessageService = inject(ChatMessageService);
  private readonly navigationService = inject(NavigationService);

  private readonly chatData = signal<ChatResponse | null>(null);
  homeData = signal<HomeResponse | null>(null);
  erro = signal('');
  groups = computed<ActiveGroup[]>(() => this.chatData()?.tour_list ?? []);

  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHeader();
    this.buscarGrupos();
  }

  buscarDadosHeader(): void {
    this.dadosClienteService.getHome().subscribe({
      next: (data) => {
        this.facade.setLoading(false);
        this.homeData.set(data);
      },
      error: (error) => this.falhou(error),
    });
  }

  buscarGrupos(): void {
    this.chatMessageService.buscarPaginaChat().subscribe({
      next: (data) => this.chatData.set(data),
      error: (error) => this.falhou(error),
    });
  }

  tentarDeNovo(): void {
    this.erro.set('');
    this.facade.setLoading(true);
    this.buscarDadosHeader();
    this.buscarGrupos();
  }

  private falhou(error: HttpErrorResponse): void {
    this.facade.setLoading(false);
    this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar suas conversas agora.'));
  }

  abrirChat(chatId: number | null, chatOpen?: boolean): void {
    if (!chatOpen || chatId == null) return;
    this.navigationService.navigateTo('chat-tour', Number(chatId));
  }
}
