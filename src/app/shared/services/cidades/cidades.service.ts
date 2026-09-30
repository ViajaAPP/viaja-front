import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { CidadeSugerida } from '../../enums/cidade.model';

@Injectable({ providedIn: 'root' })
export class CidadesService {
  private readonly request = inject(RequestService);

  buscarCidades(texto: string, uf?: string): Observable<CidadeSugerida[]> {
    const params = new URLSearchParams({ q: texto });
    if (uf) params.set('uf', uf);
    return this.request.get<CidadeSugerida[]>(`/cidades/busca?${params.toString()}`);
  }
}
