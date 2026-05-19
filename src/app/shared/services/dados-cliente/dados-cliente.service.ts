import { Injectable, inject } from '@angular/core';
import { RequestService } from '../request/request.service';
import { HomeResponse } from '../../enums/home.model';
import { HOME_MOCK } from '../../mock/home.mock';
import { Observable, of } from 'rxjs';
import { APP_CONFIG } from '../../config/app.config';

@Injectable({ providedIn: 'root' })
export class DadosClienteService {
  private request = inject(RequestService);

  getHome(): Observable<HomeResponse> {
    return APP_CONFIG.MOCK ? of(HOME_MOCK) : this.request.post('/home');
  }
}

