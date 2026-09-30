import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { Activity } from '../../enums/home.model';

@Injectable({ providedIn: 'root' })
export class FavoritoService {
  private readonly request = inject(RequestService);

  favoritar(tourId: number): Observable<{ favorite: boolean }> {
    return this.request.post<{ favorite: boolean }>(`/favorite/${tourId}`);
  }

  desfavoritar(tourId: number): Observable<{ favorite: boolean }> {
    return this.request.delete<{ favorite: boolean }>(`/favorite/${tourId}`);
  }

  listarFavoritos(): Observable<{ tours: Activity[] }> {
    return this.request.post<{ tours: Activity[] }>('/pages/favorites');
  }
}
