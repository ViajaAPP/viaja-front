import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserRole } from '../../enums/user.model';
import { limparCacheDeRespostas } from '../../interceptors/cache.interceptor';

export interface SessaoSalva {
  userId: number;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly JA_ENTROU_KEY = 'ja_entrou';
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$: Observable<string | null> = this.tokenSubject.asObservable();

  constructor() {}

  setToken(token: string): void {
    if (token && token.trim()) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.JA_ENTROU_KEY, '1');
      this.tokenSubject.next(token);
    }
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  lerSessao(): SessaoSalva | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const dados = JSON.parse(atob(base64));
      if (dados.user_id && dados.role && dados.exp * 1000 > Date.now()) {
        return { userId: dados.user_id, role: dados.role };
      }
    } catch {}

    this.clearToken();
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  jaEntrou(): boolean {
    return localStorage.getItem(this.JA_ENTROU_KEY) === '1';
  }

  sair(): void {
    localStorage.removeItem(this.JA_ENTROU_KEY);
    this.clearToken();
  }

  clearToken(): void {
    limparCacheDeRespostas();
    localStorage.removeItem(this.TOKEN_KEY);
    this.tokenSubject.next(null);
  }
}
