import { Injectable, inject } from '@angular/core';
import { RequestService } from '../request/request.service';
import { HomeResponse } from '../../enums/home.model';
import { Perfil } from '../../enums/user.model';
import { APP_CONFIG } from '../../config/app.config';
import { HOME_MOCK } from '../../mock/home.mock';
import { Observable, of, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DadosClienteService {
  private readonly request = inject(RequestService);
  private homeRequest$?: Observable<HomeResponse>;

  getHome(): Observable<HomeResponse> {
    if (APP_CONFIG.MOCK) {
      if (!this.homeRequest$) {
        this.homeRequest$ = of(HOME_MOCK).pipe(
          shareReplay({ bufferSize: 1, refCount: false })
        );
      }
      return this.homeRequest$;
    }

    if (!this.homeRequest$) {
      this.homeRequest$ = this.request.post<HomeResponse>('/pages/home').pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.homeRequest$;
  }

  getPerfil(): Observable<Perfil> {
    return this.request.post<Perfil>('/pages/profile');
  }

  limparCache(): void {
    this.homeRequest$ = undefined;
  }
}
