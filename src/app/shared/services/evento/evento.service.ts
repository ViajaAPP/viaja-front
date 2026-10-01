import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from '../request/request.service';
import { Evento, EventoPayload, FiltrosDeEventos } from '../../enums/evento.model';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly request = inject(RequestService);

  listar(filtros: FiltrosDeEventos = {}): Observable<Evento[]> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor === undefined || valor === null || valor === false) return;
      params.set(chave, valor === true ? '1' : String(valor));
    });
    const busca = params.toString();
    return this.request.get<Evento[]>(`/eventos/${busca ? '?' + busca : ''}`);
  }

  buscar(id: number): Observable<Evento> {
    return this.request.get<Evento>(`/eventos/${id}`);
  }

  meus(): Observable<Evento[]> {
    return this.request.get<Evento[]>('/eventos/meus');
  }

  ondeVou(): Observable<{ proximos: Evento[]; passados: Evento[] }> {
    return this.request.get('/eventos/vou');
  }

  paraAnalise(): Observable<Evento[]> {
    return this.request.get<Evento[]>('/eventos/analise');
  }

  enviarFoto(foto: File): Observable<{ photo: string }> {
    const formulario = new FormData();
    formulario.append('photo', foto);
    return this.request.post<{ photo: string }>('/eventos/foto', formulario);
  }

  criar(payload: EventoPayload): Observable<{ id: number }> {
    return this.request.post<{ id: number }>('/eventos/', payload);
  }

  editar(id: number, payload: Partial<EventoPayload>): Observable<{ status: string }> {
    return this.request.patch<{ status: string }>(`/eventos/${id}`, payload);
  }

  cancelar(id: number): Observable<void> {
    return this.request.post<void>(`/eventos/${id}/cancelar`);
  }

  analisar(id: number, aprovar: boolean, motivo = ''): Observable<void> {
    return this.request.post<void>(`/eventos/${id}/analise`, { aprovar, motivo });
  }

  marcarPresenca(id: number, vou: boolean): Observable<void> {
    return vou ? this.request.post<void>(`/eventos/${id}/vou`) : this.request.delete<void>(`/eventos/${id}/vou`);
  }
}
