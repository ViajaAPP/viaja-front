import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { MapaGrupoComponent, PessoaNoMapa } from '../../shared/components/mapa-grupo/mapa-grupo.component';
import { Subscription } from 'rxjs';
import { AppStore } from '../../shared/store/app.store';
import { ChatMessageService } from '../../shared/services/chat-message/chat-message.service';
import { ChatMessage, MensagensList } from '../../shared/enums/chat.model';
import { NavigationService } from '../../shared/services/navigation';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { mensagemDeErro } from '../../shared/services/request/request-error';

registerLocaleData(localePt, 'pt-BR');

const ESPERA_DA_CONFIRMACAO = 8000;
const INTERVALO_DA_LOCALIZACAO = 10000;

@Component({
  selector: 'app-chat-message',
  imports: [DatePipe, FormsModule, LoadingComponent, FalhaCarregarComponent, MapaGrupoComponent],
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
  private readonly esperas = new Map<number, ReturnType<typeof setTimeout>>();
  @ViewChild('paineis') private paineis?: ElementRef<HTMLDivElement>;
  @ViewChild(MapaGrupoComponent) private mapaGrupo?: MapaGrupoComponent;
  aba = signal<'conversa' | 'mapa'>('conversa');
  compartilhando = signal(false);
  erroDeLocalizacao = signal('');
  private minhaPosicao = signal<{ lat: number; lon: number } | null>(null);
  private observacao: number | null = null;
  private ultimoEnvio = 0;

  pessoasNoMapa = computed<(PessoaNoMapa & { at: number })[]>(() => {
    const membros = new Map((this.chatMessage()?.user_list ?? []).map((m) => [m.user_id, m]));
    const pessoas: (PessoaNoMapa & { at: number })[] = [...this.chatMessageService.localizacoes().values()]
      .filter((l) => l.user_id !== this.currentUserId)
      .map((l) => {
        const membro = membros.get(l.user_id);
        return { user_id: l.user_id, nome: membro?.first_name || 'Alguém do grupo', foto: membro?.photo, lat: l.lat, lon: l.lon, at: l.at };
      });
    const eu = this.minhaPosicao();
    if (eu && this.currentUserId !== null) {
      const membro = membros.get(this.currentUserId);
      pessoas.push({ user_id: this.currentUserId, nome: 'Você', foto: membro?.photo, lat: eu.lat, lon: eu.lon, at: Date.now() / 1000, eu: true });
    }
    return pessoas;
  });

  outrasPessoasNoMapa = computed(() => this.pessoasNoMapa().filter((p) => !p.eu));

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
    this.mensagemSubscription.add(
      this.chatMessageService.onMensagemSalva.subscribe((clientId) => {
        clearTimeout(this.esperas.get(clientId));
        this.esperas.delete(clientId);
        this.atualizar(clientId, undefined);
      })
    );

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

    if (this.chatMessageService.enviarPeloWebSocket(chatId, mensagem.text, mensagem.id)) {
      this.esperas.set(mensagem.id, setTimeout(() => {
        this.esperas.delete(mensagem.id);
        this.atualizar(mensagem.id, 'falhou');
      }, ESPERA_DA_CONFIRMACAO));
      return;
    }

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

  abrirPerfil(userId: number | null | undefined): void {
    this.navigationService.abrirPerfil(userId);
  }

  irPara(aba: 'conversa' | 'mapa'): void {
    const paineis = this.paineis?.nativeElement;
    if (!paineis) return;
    paineis.scrollTo({ left: aba === 'mapa' ? paineis.clientWidth : 0, behavior: 'smooth' });
    this.aba.set(aba);
    if (aba === 'mapa') setTimeout(() => this.mapaGrupo?.atualizarTamanho(), 350);
  }

  aoDeslizar(): void {
    const paineis = this.paineis?.nativeElement;
    if (!paineis) return;
    const aba = paineis.scrollLeft > paineis.clientWidth / 2 ? 'mapa' : 'conversa';
    if (aba !== this.aba()) {
      this.aba.set(aba);
      if (aba === 'mapa') this.mapaGrupo?.atualizarTamanho();
    }
  }

  alternarLocalizacao(): void {
    if (this.compartilhando()) return this.pararDeCompartilhar();
    if (!('geolocation' in navigator)) {
      this.erroDeLocalizacao.set('Esse navegador não deixa a gente ver sua localização.');
      return;
    }
    this.erroDeLocalizacao.set('');
    this.compartilhando.set(true);
    this.ultimoEnvio = 0;
    this.observacao = navigator.geolocation.watchPosition(
      (posicao) => {
        const lat = posicao.coords.latitude;
        const lon = posicao.coords.longitude;
        this.minhaPosicao.set({ lat, lon });
        const agora = Date.now();
        if (this.chatId !== null && agora - this.ultimoEnvio >= INTERVALO_DA_LOCALIZACAO) {
          this.ultimoEnvio = agora;
          this.chatMessageService.enviarLocalizacao(this.chatId, lat, lon);
        }
      },
      () => {
        this.erroDeLocalizacao.set('Não conseguimos sua localização. Confira se o navegador tem permissão para isso.');
        this.pararDeCompartilhar();
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  private pararDeCompartilhar(): void {
    if (this.observacao !== null) navigator.geolocation.clearWatch(this.observacao);
    this.observacao = null;
    if (this.compartilhando() && this.chatId !== null) this.chatMessageService.desligarLocalizacao(this.chatId);
    this.compartilhando.set(false);
    this.minhaPosicao.set(null);
  }

  vistoHa(at: number): string {
    const minutos = Math.floor((Date.now() / 1000 - at) / 60);
    if (minutos < 1) return 'agora';
    return minutos === 1 ? 'há 1 min' : `há ${minutos} min`;
  }

  mapaJaFechou(fechaEm: string): boolean {
    return new Date(fechaEm).getTime() < Date.now();
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
    this.pararDeCompartilhar();
    this.esperas.forEach((espera) => clearTimeout(espera));
    this.chatMessageService.desconectarWebSocket();
    this.mensagemSubscription?.unsubscribe();
  }
}
