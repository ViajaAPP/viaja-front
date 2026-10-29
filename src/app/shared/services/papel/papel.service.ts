import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { PedidoDePapel, UserRole } from '../../enums/user.model';

@Injectable({ providedIn: 'root' })
export class PapelService {
  private readonly request = inject(RequestService);

  meus(): Observable<{ pedidos: PedidoDePapel[]; aprovados: UserRole[] }> {
    return this.request.get('/users/me/papeis');
  }

  pedir(role: UserRole, cnpj: string): Observable<PedidoDePapel> {
    return this.request.post<PedidoDePapel>('/users/me/papeis', { role, cnpj });
  }

  paraAnalise(): Observable<PedidoDePapel[]> {
    return this.request.get<PedidoDePapel[]>('/users/papeis/analise');
  }

  analisar(id: number, aprovar: boolean, motivo = ''): Observable<{ message: string }> {
    return this.request.post<{ message: string }>(`/users/papeis/${id}/analise`, { aprovar, motivo });
  }
}
