import { AfterViewInit, Component, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import {
  BuscaRecente,
  BuscaService,
  CidadeSugestao,
  FiltrosDaBusca,
  LugarSugestao,
  PasseioSugestao,
  Sugestoes,
} from '../../shared/services/busca/busca.service';
import { LocalizacaoService } from '../../shared/services/localizacao/localizacao.service';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';

const VAZIO: Sugestoes = { cidades: [], passeios: [], lugares: [] };

@Component({
  selector: 'app-buscar',
  templateUrl: './buscar.component.html',
  styleUrl: './buscar.component.scss',
})
export class BuscarComponent implements OnInit, AfterViewInit {
  private readonly facade = inject(AppFacade);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);
  private readonly buscaService = inject(BuscaService);
  private readonly localizacao = inject(LocalizacaoService);
  private readonly feedback = inject(FeedbackService);
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');
  private readonly digitado = new Subject<string>();

  texto = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');
  sugestoes = signal<Sugestoes>(VAZIO);
  buscando = signal(false);
  recentes = signal<BuscaRecente[]>(this.buscaService.recentes());
  destinos = signal<CidadeSugestao[]>([]);
  localizando = signal(false);

  constructor() {
    const perto = this.localizacao.ultimaPosicao();
    this.digitado
      .pipe(
        debounceTime(180),
        distinctUntilChanged(),
        tap((texto) => this.buscando.set(!!texto.trim())),
        switchMap((texto) =>
          texto.trim() ? this.buscaService.sugestoes(texto.trim(), perto).pipe(catchError(() => of(VAZIO))) : of(VAZIO),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((sugestoes) => {
        this.buscando.set(false);
        this.sugestoes.set(sugestoes);
      });
  }

  ngOnInit(): void {
    this.facade.setLoading(false);
    this.buscaService.destinos().subscribe({ next: (destinos) => this.destinos.set(destinos), error: () => {} });
    if (this.texto()) this.digitado.next(this.texto());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.campo().nativeElement.focus());
  }

  digitar(texto: string): void {
    this.texto.set(texto);
    this.digitado.next(texto);
  }

  limpar(): void {
    this.digitar('');
    this.campo().nativeElement.focus();
  }

  semResultados(): boolean {
    const s = this.sugestoes();
    return !!this.texto().trim() && !this.buscando() && !s.cidades.length && !s.passeios.length && !s.lugares.length;
  }

  buscarTexto(): void {
    const texto = this.texto().trim();
    if (!texto) return;
    this.abrirResultados({ rotulo: texto, detalhe: 'Busca por nome', filtros: { q: texto } });
  }

  escolherCidade(cidade: CidadeSugestao): void {
    if (cidade.lat == null || cidade.lon == null) return;
    this.abrirResultados({
      rotulo: cidade.nome,
      detalhe: cidade.uf,
      filtros: { lat: cidade.lat, lon: cidade.lon, raio: 30 },
    });
  }

  escolherLugar(lugar: LugarSugestao): void {
    this.abrirResultados({
      rotulo: lugar.nome,
      detalhe: [lugar.bairro, lugar.cidade].filter(Boolean).join(', '),
      filtros: { lat: lugar.lat, lon: lugar.lon, raio: 15, ordem: 'perto' },
    });
  }

  escolherPasseio(passeio: PasseioSugestao): void {
    this.navigationService.navigateToTour('passeio', passeio.id);
  }

  repetir(busca: BuscaRecente): void {
    this.abrirResultados(busca);
  }

  esquecerRecentes(): void {
    this.buscaService.esquecerRecentes();
    this.recentes.set([]);
  }

  atalho(tipo: 'gratuito' | 'fim-de-semana'): void {
    this.abrirResultados(tipo === 'gratuito'
      ? { rotulo: 'Passeios gratuitos', detalhe: 'Todo o Brasil', filtros: { gratuito: true } }
      : { rotulo: 'Neste fim de semana', detalhe: 'Todo o Brasil', filtros: { quando: 'fim-de-semana' } });
  }

  pertoDeMim(): void {
    this.localizando.set(true);
    let posicao: { lat: number; lon: number } | null = null;
    this.localizacao.acompanhar().subscribe({
      next: (atual) => (posicao = atual),
      complete: () => {
        this.localizando.set(false);
        if (posicao) this.abrirResultados({ rotulo: 'Perto de você', detalhe: 'Até 30 km', filtros: { ...posicao, raio: 30, ordem: 'perto' } }, false);
      },
      error: (falha) => {
        this.localizando.set(false);
        this.feedback.erro(falha === 'sem-permissao'
          ? 'O navegador não liberou sua localização. Busque por uma cidade.'
          : 'Não conseguimos achar sua localização agora.');
      },
    });
  }

  descricaoDoLugar(lugar: LugarSugestao): string {
    return [lugar.rua && `${lugar.rua}${lugar.numero ? ', ' + lugar.numero : ''}`, lugar.cidade && `${lugar.cidade} - ${lugar.uf}`]
      .filter(Boolean)
      .join(' · ');
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }

  private abrirResultados(busca: BuscaRecente, lembrar = true): void {
    if (lembrar) this.buscaService.lembrar(busca);
    const filtros: FiltrosDaBusca & { rotulo: string; detalhe: string } = { ...busca.filtros, rotulo: busca.rotulo, detalhe: busca.detalhe };
    this.router.navigate(['/buscar/resultados'], { queryParams: filtros });
  }
}
