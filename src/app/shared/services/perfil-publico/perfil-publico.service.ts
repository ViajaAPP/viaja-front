import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { PerfilPublico } from '../../enums/perfil-publico.model';

@Injectable({ providedIn: 'root' })
export class PerfilPublicoService {
  private readonly request = inject(RequestService);

  buscar(userId: number): Observable<PerfilPublico> {
    return this.request.get<PerfilPublico>(`/users/${userId}/publico`);
  }
}
