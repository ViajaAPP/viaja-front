import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import * as L from 'leaflet';

const CENTRO_PADRAO: L.LatLngTuple = [-23.96, -46.33];

export interface PessoaNoMapa {
  user_id: number;
  nome: string;
  foto?: string | null;
  lat: number;
  lon: number;
  eu?: boolean;
}

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

@Component({
  selector: 'app-mapa-grupo',
  templateUrl: './mapa-grupo.component.html',
  styleUrl: './mapa-grupo.component.scss',
})
export class MapaGrupoComponent implements AfterViewInit, OnDestroy {
  pontoLat = input<number | null | undefined>(null);
  pontoLon = input<number | null | undefined>(null);
  pontoNome = input('Ponto de encontro');
  pessoas = input<PessoaNoMapa[]>([]);

  private readonly area = viewChild.required<ElementRef<HTMLDivElement>>('area');
  private mapa?: L.Map;
  private ponto?: L.Marker;
  private marcadores = new Map<number, L.Marker>();
  private enquadrado = false;

  constructor() {
    effect(() => {
      const pessoas = this.pessoas();
      if (this.mapa) this.desenhar(pessoas);
    });
  }

  ngAfterViewInit(): void {
    const lat = this.pontoLat();
    const lon = this.pontoLon();
    const temPonto = lat != null && lon != null;
    this.mapa = L.map(this.area().nativeElement, {
      center: temPonto ? [lat, lon] : CENTRO_PADRAO,
      zoom: temPonto ? 16 : 12,
      attributionControl: true,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.mapa);

    if (temPonto) {
      this.ponto = L.marker([lat, lon], {
        keyboard: false,
        title: this.pontoNome(),
        icon: L.divIcon({ className: 'mapa-grupo__ponto', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 34] }),
      })
        .bindTooltip(escapar(this.pontoNome()), { direction: 'top', offset: [0, -30] })
        .addTo(this.mapa);
    }
    this.desenhar(this.pessoas());
    setTimeout(() => this.mapa?.invalidateSize());
  }

  atualizarTamanho(): void {
    this.mapa?.invalidateSize();
  }

  private icone(pessoa: PessoaNoMapa): L.DivIcon {
    const conteudo = pessoa.foto
      ? `<img src="${escapar(pessoa.foto)}" alt="" />`
      : `<b>${escapar(pessoa.nome.charAt(0) || '?')}</b>`;
    return L.divIcon({
      className: `mapa-grupo__pessoa${pessoa.eu ? ' mapa-grupo__pessoa--eu' : ''}`,
      html: conteudo,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  private desenhar(pessoas: PessoaNoMapa[]): void {
    if (!this.mapa) return;
    const presentes = new Set(pessoas.map((p) => p.user_id));
    for (const [userId, marcador] of this.marcadores) {
      if (!presentes.has(userId)) {
        marcador.remove();
        this.marcadores.delete(userId);
      }
    }
    for (const pessoa of pessoas) {
      const existente = this.marcadores.get(pessoa.user_id);
      if (existente) {
        existente.setLatLng([pessoa.lat, pessoa.lon]);
        continue;
      }
      const marcador = L.marker([pessoa.lat, pessoa.lon], { keyboard: false, icon: this.icone(pessoa), zIndexOffset: pessoa.eu ? 1000 : 0 })
        .bindTooltip(escapar(pessoa.eu ? 'Você' : pessoa.nome), { direction: 'top', offset: [0, -20] })
        .addTo(this.mapa);
      this.marcadores.set(pessoa.user_id, marcador);
    }
    if (!this.enquadrado && pessoas.length) {
      const pontos: L.LatLngTuple[] = pessoas.map((p) => [p.lat, p.lon]);
      const ponto = this.ponto?.getLatLng();
      if (ponto) pontos.push([ponto.lat, ponto.lng]);
      this.mapa.fitBounds(L.latLngBounds(pontos), { padding: [48, 48], maxZoom: 17 });
      this.enquadrado = true;
    }
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
