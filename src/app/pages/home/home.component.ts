import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AppFacade } from '../../shared/facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { HomeResponse, Category } from '../../shared/enums/home.model';
import { FalhaDePosicao, LocalizacaoService } from '../../shared/services/localizacao/localizacao.service';
import { BuscaService, FiltrosDaBusca, PasseioEncontrado } from '../../shared/services/busca/busca.service';
import { BotaoFavoritoComponent } from '../../shared/components/botao-favorito/botao-favorito.component';
import { NavigationService } from '../../shared/services/navigation';
import { PRICE_FORMAT } from '../../shared/config/tour.config';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { EventoService } from '../../shared/services/evento/evento.service';
import { Evento, FiltrosDeEventos } from '../../shared/enums/evento.model';

const CATEGORIAS_DE_EVENTOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'gratis', label: 'De graça' },
  { id: 'nearby', label: 'Mais perto' },
  { id: 'populares', label: 'Mais procurados' },
];

const FILTROS_DE_EVENTOS: Record<string, FiltrosDeEventos> = {
  todos: { ordem: 'data' },
  gratis: { ordem: 'data', gratuito: true },
  populares: { ordem: 'populares' },
};

const FILTROS_DA_CATEGORIA: Record<string, FiltrosDaBusca> = {
  all: { ordem: 'relevancia' },
  'for-you': { ordem: 'para_voce' },
  'best-rated': { ordem: 'nota' },
  'most-searched': { ordem: 'procurados' },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, BotaoFavoritoComponent, FalhaCarregarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly dados = inject(DadosClienteService);
  private readonly router = inject(Router);
  private readonly buscaService = inject(BuscaService);
  private readonly localizacao = inject(LocalizacaoService);
  private readonly navigationService = inject(NavigationService);
  private readonly eventoService = inject(EventoService);
  readonly starIndexes = [0, 1, 2, 3, 4];

  dadosHome = signal<HomeResponse | null>(null);
  erro = signal('');
  tipo = signal<'passeios' | 'eventos'>('passeios');
  selectedCategoryId = signal<string>('all');
  categoriaDosPasseios = 'all';
  categories = computed(() => (this.tipo() === 'eventos' ? CATEGORIAS_DE_EVENTOS : this.dadosHome()?.categories ?? []));
  eventos = signal<Evento[]>([]);
  passeios = signal<PasseioEncontrado[]>([]);
  carregandoLista = signal(true);
  situacaoPerto = signal<'parado' | 'buscando' | 'sem-permissao' | 'erro' | 'pronto'>('parado');
  mostrandoPerto = computed(() => this.selectedCategoryId() === 'nearby');
  private posicao: { lat: number; lon: number } | null = null;

  tituloDaLista = computed(() => {
    if (this.tipo() === 'eventos') {
      switch (this.selectedCategoryId()) {
        case 'nearby': return 'Eventos perto de você';
        case 'gratis': return 'Eventos de graça';
        case 'populares': return 'Os mais procurados';
        default: return 'Próximos eventos';
      }
    }
    switch (this.selectedCategoryId()) {
      case 'nearby': return 'Perto de você';
      case 'for-you': return 'Escolhidos para você';
      case 'best-rated': return 'Melhor avaliados';
      case 'most-searched': return 'Mais procurados';
      default: return 'Todos os passeios';
    }
  });

  ngOnInit(): void {
    this.facade.setLoading(true);
    this.buscarDadosHome();
  }

  buscarDadosHome(): void {
    this.dados.getHome().subscribe({
      next: (data) => {
        this.facade.setLoading(false);
        this.dadosHome.set(data);
        const activeCategory = data.categories.find((cat: Category) => cat.active);
        this.selectCategory(activeCategory?.id ?? 'all');
      },
      error: (error) => {
        this.facade.setLoading(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar os passeios agora.'));
      },
    });
  }

  tentarDeNovo(): void {
    this.erro.set('');
    this.facade.setLoading(true);
    this.buscarDadosHome();
  }

  trocarTipo(tipo: 'passeios' | 'eventos'): void {
    if (this.tipo() === tipo) return;
    this.tipo.set(tipo);
    this.selectCategory(tipo === 'eventos' ? 'todos' : this.categoriaDosPasseios);
  }

  selectCategory(selectedId: string): void {
    this.selectedCategoryId.set(selectedId);
    if (this.tipo() === 'passeios') this.categoriaDosPasseios = selectedId;
    if (selectedId === 'nearby') {
      this.buscarPasseiosPerto();
      return;
    }
    const filtros = FILTROS_DA_CATEGORIA[selectedId] ?? FILTROS_DA_CATEGORIA['all'];
    const posicao = selectedId === 'for-you' ? this.localizacao.ultimaPosicao() : null;
    this.carregarLista(posicao ? { ...filtros, ...posicao } : filtros);
  }

  verTodos(): void {
    const filtros = this.filtrosAtuais();
    if (!filtros) return;
    this.router.navigate(['/buscar/resultados'], {
      queryParams: { ...filtros, rotulo: this.tituloDaLista(), detalhe: this.mostrandoPerto() ? 'Até 50 km' : 'Todo o Brasil' },
    });
  }

  textoDaListaVazia(): string {
    if (this.tipo() === 'eventos') {
      switch (this.selectedCategoryId()) {
        case 'nearby': return 'Nenhum evento perto de você por enquanto. Veja os outros enquanto isso.';
        case 'gratis': return 'Nenhum evento de graça marcado por enquanto.';
        default: return 'Ainda não tem eventos marcados por aqui. Volte daqui a pouco!';
      }
    }
    switch (this.selectedCategoryId()) {
      case 'best-rated': return 'Ainda não tem passeios avaliados por aqui.';
      case 'most-searched': return 'Ninguém pediu vaga em passeios ainda.';
      case 'nearby': return 'Ainda não tem passeio perto de você. Dá uma olhada nos outros enquanto isso.';
      default: return 'Ainda não tem passeios publicados por aqui.';
    }
  }

  abrirEvento(eventoId: number): void {
    this.navigationService.navigateToTour('evento', eventoId);
  }

  diaDoCartao(inicio: string): { semana: string; numero: string; logo: boolean } {
    const data = new Date(inicio);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dia = new Date(data);
    dia.setHours(0, 0, 0, 0);
    const dias = Math.round((dia.getTime() - hoje.getTime()) / 86400000);
    const semana = dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    return { semana, numero: String(data.getDate()).padStart(2, '0'), logo: dias <= 1 };
  }

  horaDoEvento(evento: Evento): string {
    const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return evento.end_time ? `${hora(evento.start_time)} às ${hora(evento.end_time)}` : `A partir das ${hora(evento.start_time)}`;
  }

  textoDosLugares(evento: Evento): string | null {
    if (!evento.capacity) return null;
    const livres = Math.max(evento.capacity - evento.going_count, 0);
    if (livres === 0) return 'Lotado';
    return livres <= 5 ? (livres === 1 ? 'Último lugar' : `Últimos ${livres} lugares`) : null;
  }

  abrirPasseio(tourId: number): void {
    this.navigationService.navigateToTour('passeio', tourId);
  }

  formatarPreco(preco: number): string {
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  proximaData(inicio: string): string {
    const data = new Date(inicio);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dia = new Date(data);
    dia.setHours(0, 0, 0, 0);
    const dias = Math.round((dia.getTime() - hoje.getTime()) / 86400000);
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (dias === 0) return `Hoje, ${hora}`;
    if (dias === 1) return `Amanhã, ${hora}`;
    const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const diaMes = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${diaMes}`;
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < Math.round(rating);
  }

  private filtrosAtuais(): FiltrosDaBusca | null {
    if (this.mostrandoPerto()) return this.posicao ? { ...this.posicao, raio: 50, ordem: 'perto' } : null;
    return FILTROS_DA_CATEGORIA[this.selectedCategoryId()] ?? FILTROS_DA_CATEGORIA['all'];
  }

  private carregarEventos(filtros: FiltrosDeEventos): void {
    const categoria = this.selectedCategoryId();
    this.carregandoLista.set(true);
    this.eventoService.listar({ ...filtros, limite: 12 }).subscribe({
      next: (eventos) => {
        if (this.selectedCategoryId() !== categoria || this.tipo() !== 'eventos') return;
        this.eventos.set(filtros.ordem === 'populares' ? eventos.filter((e) => e.going_count > 0) : eventos);
        this.carregandoLista.set(false);
      },
      error: () => {
        this.eventos.set([]);
        this.carregandoLista.set(false);
      },
    });
  }

  private carregarLista(filtros: FiltrosDaBusca): void {
    if (this.tipo() === 'eventos') {
      const { lat, lon, raio } = filtros;
      this.carregarEventos(this.selectedCategoryId() === 'nearby' ? { lat, lon, raio, ordem: 'perto' } : FILTROS_DE_EVENTOS[this.selectedCategoryId()] ?? FILTROS_DE_EVENTOS['todos']);
      return;
    }
    const categoria = this.selectedCategoryId();
    this.carregandoLista.set(true);
    this.buscaService.passeios({ ...filtros, limite: 12 }).subscribe({
      next: (passeios) => {
        if (this.selectedCategoryId() !== categoria || this.tipo() !== 'passeios') return;
        const uteis = filtros.ordem === 'nota'
          ? passeios.filter((p) => p.reviewCount > 0)
          : filtros.ordem === 'procurados' ? passeios.filter((p) => p.searches > 0) : passeios;
        this.passeios.set(uteis);
        this.carregandoLista.set(false);
      },
      error: () => {
        this.passeios.set([]);
        this.carregandoLista.set(false);
      },
    });
  }

  private buscarPasseiosPerto(): void {
    this.situacaoPerto.set('buscando');
    this.passeios.set([]);
    this.eventos.set([]);
    this.localizacao.acompanhar().subscribe({
      next: (posicao) => {
        this.posicao = posicao;
        this.situacaoPerto.set('pronto');
        this.carregarLista({ ...posicao, raio: 50, ordem: 'perto' });
      },
      error: (falha: FalhaDePosicao) => {
        this.situacaoPerto.set(falha);
        this.carregandoLista.set(false);
      },
    });
  }
}
