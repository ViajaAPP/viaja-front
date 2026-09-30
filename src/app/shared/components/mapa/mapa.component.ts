import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';

const CENTRO_PADRAO: L.LatLngTuple = [-23.96, -46.33];

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.scss',
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  lat = input<number | null | undefined>(null);
  lon = input<number | null | undefined>(null);
  editavel = input(false);
  rotulo = input('Local no mapa');
  moveu = output<{ lat: number; lon: number }>();

  private readonly area = viewChild.required<ElementRef<HTMLDivElement>>('area');
  private mapa?: L.Map;
  private marcador?: L.Marker;

  constructor() {
    effect(() => {
      const lat = this.lat();
      const lon = this.lon();
      if (this.mapa && lat != null && lon != null) this.posicionar(lat, lon);
    });
  }

  ngAfterViewInit(): void {
    const lat = this.lat();
    const lon = this.lon();
    const temPonto = lat != null && lon != null;
    this.mapa = L.map(this.area().nativeElement, {
      center: temPonto ? [lat, lon] : CENTRO_PADRAO,
      zoom: temPonto ? 16 : 11,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.mapa);

    if (temPonto) this.posicionar(lat, lon);
    if (this.editavel()) {
      this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
        this.posicionar(evento.latlng.lat, evento.latlng.lng);
        this.moveu.emit({ lat: evento.latlng.lat, lon: evento.latlng.lng });
      });
    }
    setTimeout(() => this.mapa?.invalidateSize());
  }

  private posicionar(lat: number, lon: number): void {
    if (!this.mapa) return;
    const ponto: L.LatLngTuple = [lat, lon];
    if (!this.marcador) {
      this.marcador = L.marker(ponto, {
        draggable: this.editavel(),
        keyboard: false,
        icon: L.divIcon({ className: 'mapa__pino', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 34] }),
      }).addTo(this.mapa);
      this.marcador.on('dragend', () => {
        const posicao = this.marcador!.getLatLng();
        this.moveu.emit({ lat: posicao.lat, lon: posicao.lng });
      });
    } else {
      this.marcador.setLatLng(ponto);
    }
    this.mapa.setView(ponto, Math.max(this.mapa.getZoom(), 16));
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
