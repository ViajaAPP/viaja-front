import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';

export interface CidadeDoRoteiro {
  nome: string;
  uf: string;
  passeios: number;
}

export interface ParadaDoRoteiro {
  tipo: 'passeio' | 'evento';
  id: number;
  instancia_id: number | null;
  titulo: string;
  foto: string | null;
  preco: number | null;
  nota: number | null;
  avaliacoes: number;
  vao?: number;
  lugar: string | null;
  lat: number;
  lon: number;
  inicio: string;
  fim: string;
  km_do_anterior: number | null;
}

export interface Roteiro {
  cidade: string;
  uf: string;
  dias: { data: string; itens: ParadaDoRoteiro[] }[];
}

@Injectable({ providedIn: 'root' })
export class RoteiroService {
  private readonly request = inject(RequestService);

  cidades(): Observable<CidadeDoRoteiro[]> {
    return this.request.get<CidadeDoRoteiro[]>('/roteiro/cidades');
  }

  montar(cidade: string, uf: string, inicio: string, dias: number): Observable<Roteiro> {
    const params = new URLSearchParams({ cidade, uf, inicio, dias: String(dias) });
    return this.request.get<Roteiro>(`/roteiro/?${params.toString()}`);
  }
}
