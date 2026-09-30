import { Injectable, signal } from '@angular/core';

const CHAVE = 'menu_aberto';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly menuAberto = signal(this.lerPreferencia());

  alternarMenu(): void {
    const aberto = !this.menuAberto();
    this.menuAberto.set(aberto);
    try {
      localStorage.setItem(CHAVE, aberto ? '1' : '0');
    } catch {}
  }

  private lerPreferencia(): boolean {
    try {
      return localStorage.getItem(CHAVE) === '1';
    } catch {
      return false;
    }
  }
}
