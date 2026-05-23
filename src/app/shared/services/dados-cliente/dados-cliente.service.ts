import { Injectable, inject } from '@angular/core';
import { RequestService } from '../request/request.service';
import { HomeResponse } from '../../enums/home.model';
import { HOME_MOCK } from '../../mock/home.mock';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DadosClienteService {
  private request = inject(RequestService);

  getHome(): Observable<HomeResponse> {
    return this.request.post('/pages/home') ? this.request.post('/pages/home') : of(HOME_MOCK);
  }
}

