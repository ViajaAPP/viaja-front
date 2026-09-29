import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import {
  RequestStatus,
  Tour,
  TourDetail,
  TourInstancePayload,
  TourPayload,
  TourRequestItem,
} from '../../enums/tour.model';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly request = inject(RequestService);

  listarPasseiosGerenciados(): Observable<Tour[]> {
    return this.request.get<Tour[]>('/tour/mine');
  }

  buscarPasseio(tourId: number): Observable<TourDetail> {
    return this.request.get<TourDetail>(`/tour/${tourId}`);
  }

  criarPasseio(payload: TourPayload): Observable<{ tour_id: number }> {
    return this.request.post<{ tour_id: number }>('/tour/', payload);
  }

  editarPasseio(tourId: number, payload: Partial<TourPayload>): Observable<void> {
    return this.request.patch<void>(`/tour/${tourId}`, payload);
  }

  publicarPasseio(tourId: number, published: boolean): Observable<void> {
    return this.request.patch<void>(`/tour/${tourId}/publish`, { published });
  }

  criarData(
    tourId: number,
    payload: Required<Pick<TourInstancePayload, 'start_time' | 'max_capacity'>>,
  ): Observable<void> {
    return this.request.post<void>(`/tour/${tourId}/instance`, payload);
  }

  editarData(tourId: number, instanceId: number, payload: TourInstancePayload): Observable<void> {
    return this.request.patch<void>(`/tour/${tourId}/instance/${instanceId}`, payload);
  }

  listarSolicitacoesDaData(instanceId: number): Observable<TourRequestItem[]> {
    return this.request.get<TourRequestItem[]>(`/request/instances/${instanceId}`);
  }

  responderSolicitacao(requestId: number, status: RequestStatus): Observable<void> {
    return this.request.patch<void>(`/request/${requestId}`, { status });
  }

  solicitarVaga(instanceId: number, message: string): Observable<void> {
    return this.request.post<void>(`/request/instances/${instanceId}`, { message });
  }

  listarMinhasSolicitacoes(): Observable<TourRequestItem[]> {
    return this.request.get<TourRequestItem[]>('/request/');
  }
}
