import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';

export interface CidadeSugestao {
  tipo: 'cidade';
  nome: string;
  uf: string;
  ibge?: number;
  lat: number | null;
  lon: number | null;
  passeios?: number;
}

export interface PasseioSugestao {
  tipo: 'passeio';
  id: number;
  nome: string;
  cidade: string | null;
  uf: string | null;
  foto: string | null;
}

export interface LugarSugestao {
  tipo: 'lugar';
  nome: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  lat: number;
  lon: number;
}

export interface Sugestoes {
  cidades: CidadeSugestao[];
  passeios: PasseioSugestao[];
  lugares: LugarSugestao[];
}

export interface FiltrosDaBusca {
  q?: string;
  lat?: number;
  lon?: number;
  raio?: number;
  gratuito?: boolean;
  preco_max?: number;
  quando?: 'hoje' | 'fim-de-semana' | '7-dias';
  nota_min?: number;
  ordem?: 'relevancia' | 'perto' | 'nota' | 'curtidos' | 'procurados' | 'preco';
  limite?: number;
}

export interface PasseioEncontrado {
  id: number;
  title: string;
  imageUrl: string | null;
  guide: string;
  guideFoto: string | null;
  price: number;
  city: string | null;
  uf: string | null;
  distance_km: number | null;
  rating: number | null;
  reviewCount: number;
  likes: number;
  searches: number;
  nextDate: string | null;
  favorite: boolean;
}

export interface BuscaRecente {
  rotulo: string;
  detalhe: string;
  filtros: FiltrosDaBusca;
}

const CHAVE_RECENTES = 'buscas_recentes';

@Injectable({ providedIn: 'root' })
export class BuscaService {
  private readonly request = inject(RequestService);

  sugestoes(texto: string, perto?: { lat: number; lon: number } | null): Observable<Sugestoes> {
    const params = new URLSearchParams({ q: texto });
    if (perto) {
      params.set('lat', String(perto.lat));
      params.set('lon', String(perto.lon));
    }
    return this.request.get<Sugestoes>(`/busca/sugestoes?${params.toString()}`);
  }

  destinos(): Observable<CidadeSugestao[]> {
    return this.request.get<CidadeSugestao[]>('/busca/destinos');
  }

  passeios(filtros: FiltrosDaBusca): Observable<PasseioEncontrado[]> {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor === undefined || valor === null || valor === '' || valor === false) continue;
      params.set(chave, valor === true ? '1' : String(valor));
    }
    return this.request.get<PasseioEncontrado[]>(`/busca/passeios?${params.toString()}`);
  }

  recentes(): BuscaRecente[] {
    try {
      const salvas = JSON.parse(localStorage.getItem(CHAVE_RECENTES) ?? '[]');
      return Array.isArray(salvas) ? salvas.slice(0, 5) : [];
    } catch {
      return [];
    }
  }

  lembrar(busca: BuscaRecente): void {
    try {
      const outras = this.recentes().filter((b) => b.rotulo !== busca.rotulo || b.detalhe !== busca.detalhe);
      localStorage.setItem(CHAVE_RECENTES, JSON.stringify([busca, ...outras].slice(0, 5)));
    } catch {}
  }

  esquecerRecentes(): void {
    try {
      localStorage.removeItem(CHAVE_RECENTES);
    } catch {}
  }
}
