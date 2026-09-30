import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Posicao {
  lat: number;
  lon: number;
}

export type FalhaDePosicao = 'sem-permissao' | 'erro';

const CHAVE = 'ultima_posicao';

@Injectable({ providedIn: 'root' })
export class LocalizacaoService {
  ultimaPosicao(): Posicao | null {
    try {
      const salva = JSON.parse(localStorage.getItem(CHAVE) ?? 'null');
      return salva && typeof salva.lat === 'number' && typeof salva.lon === 'number' ? salva : null;
    } catch {
      return null;
    }
  }

  acompanhar(): Observable<Posicao> {
    return new Observable<Posicao>((assinante) => {
      const anterior = this.ultimaPosicao();
      if (anterior) assinante.next(anterior);
      if (!navigator.geolocation) {
        if (anterior) assinante.complete();
        else assinante.error('erro' as FalhaDePosicao);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const atual = { lat: coords.latitude, lon: coords.longitude };
          try {
            localStorage.setItem(CHAVE, JSON.stringify(atual));
          } catch {}
          if (!anterior || this.distanciaKm(anterior, atual) > 1) assinante.next(atual);
          assinante.complete();
        },
        (erro) => {
          if (anterior) assinante.complete();
          else assinante.error((erro.code === erro.PERMISSION_DENIED ? 'sem-permissao' : 'erro') as FalhaDePosicao);
        },
        { timeout: 10000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false },
      );
    });
  }

  distanciaKm(a: Posicao, b: Posicao): number {
    const rad = (graus: number) => (graus * Math.PI) / 180;
    const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2
      + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(x));
  }
}
