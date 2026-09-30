import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AppFacade } from '../../shared/facade';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { HomeResponse, Category } from '../../shared/enums/home.model';
import { FalhaDePosicao, LocalizacaoService } from '../../shared/services/localizacao/localizacao.service';
import { BuscaService, FiltrosDaBusca, PasseioEncontrado } from '../../shared/services/busca/busca.service';
import { CartaoPasseioComponent } from '../../shared/components/cartao-passeio/cartao-passeio.component';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';
import { mensagemDeErro } from '../../shared/services/request/request-error';

const FILTROS_DA_CATEGORIA: Record<string, FiltrosDaBusca> = {
  all: { ordem: 'relevancia' },
  'most-liked': { ordem: 'curtidos' },
  'most-searched': { ordem: 'procurados' },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, CartaoPasseioComponent, FalhaCarregarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly dados = inject(DadosClienteService);
  private readonly router = inject(Router);
  private readonly buscaService = inject(BuscaService);
  private readonly localizacao = inject(LocalizacaoService);

  dadosHome = signal<HomeResponse | null>(null);
  erro = signal('');
  selectedCategoryId = signal<string>('all');
  categories = computed(() => this.dadosHome()?.categories ?? []);
  passeios = signal<PasseioEncontrado[]>([]);
  carregandoLista = signal(true);
  situacaoPerto = signal<'parado' | 'buscando' | 'sem-permissao' | 'erro' | 'pronto'>('parado');
  mostrandoPerto = computed(() => this.selectedCategoryId() === 'nearby');
  private posicao: { lat: number; lon: number } | null = null;

  tituloDaLista = computed(() => {
    switch (this.selectedCategoryId()) {
      case 'nearby': return 'Perto de você';
      case 'most-liked': return 'Mais curtidos';
      case 'most-searched': return 'Mais procurados';
      default: return 'Passeios para você';
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

  selectCategory(selectedId: string): void {
    this.selectedCategoryId.set(selectedId);
    if (selectedId === 'nearby') {
      this.buscarPasseiosPerto();
      return;
    }
    this.carregarLista(FILTROS_DA_CATEGORIA[selectedId] ?? FILTROS_DA_CATEGORIA['all']);
  }

  verTodos(): void {
    const filtros = this.filtrosAtuais();
    if (!filtros) return;
    this.router.navigate(['/buscar/resultados'], {
      queryParams: { ...filtros, rotulo: this.tituloDaLista(), detalhe: this.mostrandoPerto() ? 'Até 50 km' : 'Todo o Brasil' },
    });
  }

  textoDaListaVazia(): string {
    switch (this.selectedCategoryId()) {
      case 'most-liked': return 'Ninguém curtiu passeios ainda. Toque no coração dos que você gostar.';
      case 'most-searched': return 'Ninguém pediu vaga em passeios ainda.';
      case 'nearby': return 'Ainda não tem passeio perto de você. Dá uma olhada nos outros enquanto isso.';
      default: return 'Ainda não tem passeios publicados por aqui.';
    }
  }

  private filtrosAtuais(): FiltrosDaBusca | null {
    if (this.mostrandoPerto()) return this.posicao ? { ...this.posicao, raio: 50, ordem: 'perto' } : null;
    return FILTROS_DA_CATEGORIA[this.selectedCategoryId()] ?? FILTROS_DA_CATEGORIA['all'];
  }

  private carregarLista(filtros: FiltrosDaBusca): void {
    const categoria = this.selectedCategoryId();
    this.carregandoLista.set(true);
    this.buscaService.passeios({ ...filtros, limite: 12 }).subscribe({
      next: (passeios) => {
        if (this.selectedCategoryId() !== categoria) return;
        const uteis = filtros.ordem === 'curtidos'
          ? passeios.filter((p) => p.likes > 0)
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
