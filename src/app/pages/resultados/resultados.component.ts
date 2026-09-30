import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { BuscaService, FiltrosDaBusca, PasseioEncontrado } from '../../shared/services/busca/busca.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { PRICE_FORMAT } from '../../shared/config/tour.config';
import { BotaoFavoritoComponent } from '../../shared/components/botao-favorito/botao-favorito.component';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';

type Ordem = NonNullable<FiltrosDaBusca['ordem']>;

export const ORDENS: { valor: Ordem; rotulo: string; precisaDeLocal?: boolean }[] = [
  { valor: 'relevancia', rotulo: 'Relevância' },
  { valor: 'perto', rotulo: 'Mais perto', precisaDeLocal: true },
  { valor: 'nota', rotulo: 'Melhor avaliados' },
  { valor: 'curtidos', rotulo: 'Mais curtidos' },
  { valor: 'preco', rotulo: 'Menor preço' },
];

const PRECOS = [
  { rotulo: 'Qualquer preço', gratuito: false, max: undefined },
  { rotulo: 'Gratuito', gratuito: true, max: undefined },
  { rotulo: 'Até R$ 50', gratuito: false, max: 50 },
  { rotulo: 'Até R$ 100', gratuito: false, max: 100 },
  { rotulo: 'Até R$ 200', gratuito: false, max: 200 },
];

const QUANDOS: { valor: FiltrosDaBusca['quando']; rotulo: string }[] = [
  { valor: undefined, rotulo: 'Qualquer dia' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'fim-de-semana', rotulo: 'Fim de semana' },
  { valor: '7-dias', rotulo: 'Próximos 7 dias' },
];

const NOTAS = [
  { valor: undefined, rotulo: 'Qualquer nota' },
  { valor: 4, rotulo: '4 ou mais' },
  { valor: 4.5, rotulo: '4,5 ou mais' },
];

const RAIOS = [10, 30, 50, 100];

@Component({
  selector: 'app-resultados',
  imports: [DatePipe, BotaoFavoritoComponent, FalhaCarregarComponent],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.scss',
})
export class ResultadosComponent {
  private readonly facade = inject(AppFacade);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly buscaService = inject(BuscaService);

  readonly ordens = ORDENS;
  readonly precos = PRECOS;
  readonly quandos = QUANDOS;
  readonly notas = NOTAS;
  readonly raios = RAIOS;

  rotulo = signal('');
  detalhe = signal('');
  filtros = signal<FiltrosDaBusca>({});
  rascunho = signal<FiltrosDaBusca>({});
  passeios = signal<PasseioEncontrado[]>([]);
  carregando = signal(true);
  erro = signal('');
  folhaAberta = signal(false);

  constructor() {
    this.rota.queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      this.facade.setLoading(false);
      this.rotulo.set(params.get('rotulo') || 'Todos os passeios');
      this.detalhe.set(params.get('detalhe') || 'Todo o Brasil');
      this.filtros.set(this.lerFiltros(params));
      if (params.get('filtros') === '1') this.abrirFolha();
      this.buscar();
    });
  }

  temLocal(): boolean {
    const f = this.filtros();
    return f.lat != null && f.lon != null;
  }

  quantidadeDeFiltros(): number {
    const f = this.filtros();
    return [f.gratuito || f.preco_max != null, !!f.quando, !!f.nota_min, this.temLocal() && f.raio != null && f.raio !== 30]
      .filter(Boolean).length;
  }

  rotuloDaOrdem(): string {
    return ORDENS.find((o) => o.valor === (this.filtros().ordem ?? 'relevancia'))?.rotulo ?? 'Relevância';
  }

  alternarGratuito(): void {
    const f = this.filtros();
    this.aplicar({ ...f, gratuito: !f.gratuito, preco_max: undefined });
  }

  alternarFimDeSemana(): void {
    const f = this.filtros();
    this.aplicar({ ...f, quando: f.quando === 'fim-de-semana' ? undefined : 'fim-de-semana' });
  }

  alternarBemAvaliados(): void {
    const f = this.filtros();
    this.aplicar({ ...f, nota_min: f.nota_min ? undefined : 4 });
  }

  abrirFolha(): void {
    this.rascunho.set({ ...this.filtros() });
    this.folhaAberta.set(true);
  }

  fecharFolha(): void {
    this.folhaAberta.set(false);
  }

  mudarRascunho(mudanca: Partial<FiltrosDaBusca>): void {
    this.rascunho.update((r) => ({ ...r, ...mudanca }));
  }

  precoEscolhido(preco: (typeof PRECOS)[number]): boolean {
    const r = this.rascunho();
    return !!r.gratuito === preco.gratuito && r.preco_max === preco.max;
  }

  limparRascunho(): void {
    const r = this.rascunho();
    this.rascunho.set({ q: r.q, lat: r.lat, lon: r.lon, raio: this.temLocal() ? 30 : undefined });
  }

  aplicarRascunho(): void {
    this.folhaAberta.set(false);
    this.aplicar(this.rascunho());
  }

  limparTudo(): void {
    const f = this.filtros();
    this.aplicar({ q: f.q, lat: f.lat, lon: f.lon, raio: this.temLocal() ? 30 : undefined });
  }

  aumentarDistancia(): void {
    const f = this.filtros();
    this.aplicar({ ...f, raio: Math.min((f.raio ?? 30) * 2, 200) });
  }

  formatarPreco(preco: number): string {
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  abrirPasseio(passeio: PasseioEncontrado): void {
    this.navigationService.navigateToTour('passeio', passeio.id);
  }

  editarBusca(): void {
    const q = this.filtros().q ?? (this.temLocal() ? this.rotulo() : '');
    this.router.navigate(['/buscar'], { queryParams: q ? { q } : {} });
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }

  buscar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.buscaService.passeios(this.filtros()).subscribe({
      next: (passeios) => {
        this.passeios.set(passeios);
        this.carregando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos buscar os passeios agora.'));
      },
    });
  }

  private aplicar(filtros: FiltrosDaBusca): void {
    const limpos = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '' && valor !== false),
    );
    this.router.navigate([], {
      relativeTo: this.rota,
      queryParams: { ...limpos, rotulo: this.rotulo(), detalhe: this.detalhe() },
      replaceUrl: true,
    });
  }

  private lerFiltros(params: ParamMap): FiltrosDaBusca {
    const numero = (nome: string) => {
      const valor = params.get(nome);
      return valor === null || valor === '' || isNaN(Number(valor)) ? undefined : Number(valor);
    };
    const quando = params.get('quando');
    const ordem = params.get('ordem');
    return {
      q: params.get('q') || undefined,
      lat: numero('lat'),
      lon: numero('lon'),
      raio: numero('raio'),
      gratuito: params.get('gratuito') === 'true' || params.get('gratuito') === '1',
      preco_max: numero('preco_max'),
      quando: quando === 'hoje' || quando === 'fim-de-semana' || quando === '7-dias' ? quando : undefined,
      nota_min: numero('nota_min'),
      ordem: ORDENS.some((o) => o.valor === ordem) ? (ordem as Ordem) : undefined,
    };
  }
}
