import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { API_CONFIG } from '../../config/api.config';
import { LoginResponse, UserRole } from '../../enums/user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  cnpj: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone: string;
  photo: string;
  role: UserRole;
  username: string;
}

export interface MessageRequest {
  chat_id: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private request: RequestService) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.request.post<LoginResponse>('/auth/login', payload);
  }

  esqueciSenha(email: string): Observable<{ message: string }> {
    return this.request.post<{ message: string }>('/auth/esqueci-senha', { email });
  }

  redefinirSenha(codigo: string, password: string): Observable<{ message: string }> {
    return this.request.post<{ message: string }>('/auth/redefinir-senha', { codigo, password });
  }

  register(payload: RegisterRequest, foto?: File | null): Observable<any> {
    if (!foto) return this.request.post('/auth/register', payload);
    const formulario = new FormData();
    Object.entries(payload).forEach(([campo, valor]) => formulario.append(campo, valor ?? ''));
    formulario.append('photo', foto);
    return this.request.post('/auth/register', formulario);
  }

  startChat(tourInstanceId: number): Observable<{ chat_id: number }> {
    return this.request.post<{ chat_id: number }>(`/chat/instances/${tourInstanceId}`);
  }

  sendMessage(payload: MessageRequest): Observable<any> {
    return this.request.post('/messages/send', payload);
  }

  getWebSocketUrl(): string {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.SOCKET_PATH}`;
  }
}
