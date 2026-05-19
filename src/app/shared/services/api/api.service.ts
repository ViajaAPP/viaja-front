import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { API_CONFIG } from '../../config/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  cnpj: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  username: string;
}

export interface MessageRequest {
  chat_id: string;
  content: string;
}

export interface TourRequest {
  cep: string;
  city: string;
  description: string;
  estimated_duration_minutes: number;
  meeting_point: string;
  neighborhood: string;
  number: string;
  price: number;
  title: string;
  uf: string;
}

export interface TourInstanceRequest {
  max_capacity: number;
  start_time: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private request: RequestService) {}

  login(payload: LoginRequest): Observable<any> {
    return this.request.post('/auth/login', payload);
  }

  register(payload: RegisterRequest): Observable<any> {
    return this.request.post('/auth/register', payload);
  }

  startChat(tourInstanceId: string): Observable<any> {
    return this.request.post(`/chat/instances/${tourInstanceId}`);
  }

  sendMessage(payload: MessageRequest): Observable<any> {
    return this.request.post('/messages/send', payload);
  }

  createTour(payload: TourRequest): Observable<any> {
    return this.request.post('/tour', payload);
  }

  createTourInstance(tourId: string, payload: TourInstanceRequest): Observable<any> {
    return this.request.post(`/tour/${tourId}/instance`, payload);
  }

  getTourInstance(tourId: string, instanceId: string): Observable<any> {
    return this.request.get(`/tour/${tourId}/instance/${instanceId}`);
  }

  getWebSocketUrl(): string {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.SOCKET_PATH}`;
  }
}
