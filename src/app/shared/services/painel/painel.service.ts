import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { PublicUser, RequestStatus, TourStatus, RegistrationStatus } from '../../enums/tour.model';

export interface PedidoDoPainel {
  id: number;
  tour_instance_id: number;
  requester_id: number;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  last_updated: string | null;
  tour_id: number;
  tour_title: string;
  tour_photo: string | null;
  start_time: string;
  max_capacity: number;
  requester: Partial<PublicUser>;
  expires_at: string;
}

export interface DataDaAgenda {
  id: number;
  tour_id: number;
  start_time: string;
  max_capacity: number;
  status: TourStatus;
  registration: RegistrationStatus;
  tour_title: string;
  tour_photo: string | null;
  price: number;
  min_participants: number;
  confirmed: number;
  pending: number;
  chat_id: number | null;
}

export interface Viagem {
  id: number;
  status: RequestStatus;
  created_at: string;
  instance_id: number;
  start_time: string;
  instance_status: TourStatus;
  tour_id: number;
  tour_title: string;
  tour_photo: string | null;
  price: number;
  meeting_point: string;
  guide: Partial<PublicUser> | null;
  chat_id: number | null;
  can_review: boolean;
  expires_at: string;
}

export interface Viagens {
  proximas: Viagem[];
  esperando: Viagem[];
  passadas: Viagem[];
  encerradas: Viagem[];
}

@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly request = inject(RequestService);

  pedidos(): Observable<{ esperando: PedidoDoPainel[]; respondidos: PedidoDoPainel[] }> {
    return this.request.get('/painel/pedidos');
  }

  arquivados(): Observable<{ pedidos: PedidoDoPainel[]; datas: (DataDaAgenda & { confirmed: number })[] }> {
    return this.request.get('/painel/arquivados');
  }

  agenda(): Observable<DataDaAgenda[]> {
    return this.request.get<DataDaAgenda[]>('/painel/agenda');
  }

  contagem(): Observable<{ pendentes: number }> {
    return this.request.get<{ pendentes: number }>('/painel/contagem');
  }

  viagens(): Observable<Viagens> {
    return this.request.get<Viagens>('/painel/viagens');
  }
}
