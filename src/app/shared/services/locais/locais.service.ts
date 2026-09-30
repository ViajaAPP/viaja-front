import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';

export interface LocalEncontrado {
  nome: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  lat: number;
  lon: number;
}

@Injectable({ providedIn: 'root' })
export class LocaisService {
  private readonly request = inject(RequestService);

  buscar(texto: string): Observable<LocalEncontrado[]> {
    const params = new URLSearchParams({ q: texto });
    return this.request.get<LocalEncontrado[]>(`/locais/busca?${params.toString()}`);
  }

  enderecoDoPonto(lat: number, lon: number): Observable<LocalEncontrado | null> {
    return this.request.get<LocalEncontrado | null>(`/locais/ponto?lat=${lat}&lon=${lon}`);
  }
}
