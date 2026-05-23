import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$: Observable<string | null> = this.tokenSubject.asObservable();

  constructor() {}

  setToken(token: string): void {
    if (token && token.trim()) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.tokenSubject.next(token);
    }
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.tokenSubject.next(null);
  }
}
