import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import * as L from 'leaflet';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { TourService } from '../../shared/services/tour/tour.service';
import { EventoService } from '../../shared/services/evento/evento.service';
import { LocalizacaoService, Posicao } from '../../shared/services/localizacao/localizacao.service';
import { Activity } from '../../shared/enums/home.model';
import { Evento } from '../../shared/enums/evento.model';
import { PRICE_FORMAT } from '../../shared/config/tour.config';

registerLocaleData(localePt, 'pt-BR');

type Filtro = 'tudo' | 'passeios' | 'eventos';

interface PontoNoMapa {
  tipo: 'passeio' | 'evento';
  id: number;
  titulo: string;
  foto: string | null;
  lat: number;
  lon: number;
  distancia: number | null;
  preco: number | null;
  nota: number | null;
  quando: string | null;
  cidade: string | null;
}

const CENTRO_PADRAO: Posicao = { lat: -23.96, lon: -46.33 };
const RAIO_KM = 60;

@Component({
  selector: 'app-mapa-perto',
  imports: [DatePipe],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.scss',
})
export class MapaPertoComponent implements AfterViewInit, OnDestroy {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);
  private readonly eventoService = inject(EventoService);
  private readonly localizacao = inject(LocalizacaoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly area = viewChild.required<ElementRef<HTMLDivElement>>('area');
  private mapa?: L.Map;
  private camada = L.layerGroup();
  private voce?: L.CircleMarker;

  filtro = signal<Filtro>('tudo');
  pontos = signal<PontoNoMapa[]>([]);
  selecionado = signal<PontoNoMapa | null>(null);
  posicao = signal<Posicao | null>(null);
  carregando = signal(true);
  semLocalizacao = signal(false);

  visiveis = computed(() => {
    const filtro = this.filtro();
    return this.pontos().filter((ponto) => filtro === 'tudo' || (filtro === 'passeios' ? ponto.tipo === 'passeio' : ponto.tipo === 'evento'));
  });
  contagem = computed(() => ({
    passeios: this.pontos().filter((ponto) => ponto.tipo === 'passeio').length,
    eventos: this.pontos().filter((ponto) => ponto.tipo === 'evento').length,
  }));

  constructor() {
    effect(() => this.desenhar(this.visiveis()));
  }

  ngAfterViewInit(): void {
    this.facade.setLoading(false);
    const inicio = this.localizacao.ultimaPosicao() ?? CENTRO_PADRAO;
    this.mapa = L.map(this.area().nativeElement, { center: [inicio.lat, inicio.lon], zoom: 12, zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(this.mapa);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.mapa);
    this.camada.addTo(this.mapa);
    this.mapa.on('click', () => this.selecionado.set(null));
    setTimeout(() => this.mapa?.invalidateSize());

    const assinatura = this.localizacao.acompanhar().subscribe({
      next: (posicao) => this.carregar(posicao),
      error: () => {
        this.semLocalizacao.set(true);
        this.carregar(CENTRO_PADRAO);
      },
    });
    this.destroyRef.onDestroy(() => assinatura.unsubscribe());
  }

  private carregar(posicao: Posicao): void {
    this.posicao.set(posicao);
    this.carregando.set(true);
    forkJoin([
      this.tourService.listarPasseiosPerto(posicao.lat, posicao.lon).pipe(catchError(() => of([] as Activity[]))),
      this.eventoService.listar({ lat: posicao.lat, lon: posicao.lon, raio: RAIO_KM }).pipe(catchError(() => of([] as Evento[]))),
    ]).subscribe(([passeios, eventos]) => {
      this.pontos.set([
        ...passeios
          .filter((p) => p.lat != null && p.lon != null && (p.distance_km ?? 0) <= RAIO_KM)
          .map((p): PontoNoMapa => ({
            tipo: 'passeio', id: Number(p.id), titulo: p.title, foto: p.imageUrl, lat: p.lat!, lon: p.lon!,
            distancia: p.distance_km ?? null, preco: p.price ?? null, nota: p.rating, quando: null, cidade: p.city ?? null,
          })),
        ...eventos
          .filter((e) => e.lat != null && e.lon != null)
          .map((e): PontoNoMapa => ({
            tipo: 'evento', id: e.id, titulo: e.title, foto: e.photo, lat: e.lat!, lon: e.lon!,
            distancia: e.distance_km, preco: e.price, nota: null, quando: e.start_time, cidade: e.city,
          })),
      ]);
      this.carregando.set(false);
      this.mostrarVoce(posicao);
    });
  }

  private mostrarVoce(posicao: Posicao): void {
    if (!this.mapa || this.semLocalizacao()) return;
    if (!this.voce) {
      this.voce = L.circleMarker([posicao.lat, posicao.lon], { radius: 9, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1 }).addTo(this.mapa);
    } else {
      this.voce.setLatLng([posicao.lat, posicao.lon]);
    }
  }

  private desenhar(pontos: PontoNoMapa[]): void {
    if (!this.mapa) return;
    this.camada.clearLayers();
    pontos.forEach((ponto) => {
      const marcador = L.marker([ponto.lat, ponto.lon], {
        keyboard: false,
        title: ponto.titulo,
        icon: L.divIcon({ className: `pino pino--${ponto.tipo}`, html: `<span><i class="bi ${ponto.tipo === 'passeio' ? 'bi-compass' : 'bi-calendar-event'}"></i></span>`, iconSize: [34, 42], iconAnchor: [17, 40] }),
      });
      marcador.on('click', (evento) => {
        L.DomEvent.stopPropagation(evento);
        this.selecionado.set(ponto);
        this.mapa?.panTo([ponto.lat, ponto.lon]);
      });
      marcador.addTo(this.camada);
    });
  }

  centralizar(): void {
    const posicao = this.posicao();
    if (posicao) this.mapa?.setView([posicao.lat, posicao.lon], 13);
  }

  formatarPreco(preco: number | null): string {
    if (preco == null) return '';
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  abrir(ponto: PontoNoMapa): void {
    if (ponto.tipo === 'passeio') this.navigationService.navigateToTour('passeio', ponto.id);
    else this.navigationService.navigateToTour('evento', ponto.id);
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
