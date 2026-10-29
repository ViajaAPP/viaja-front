import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RequestService } from '../request/request.service';
import { FeedbackService } from '../feedback/feedback.service';

export interface Conflito {
  tipo: 'passeio' | 'evento';
  id: number;
  titulo: string;
  inicio: string;
  fim: string;
  confirmado: boolean;
}

export interface CompromissoNaAgenda {
  titulo: string;
  inicio: string;
  fim?: string | null;
  duracaoMinutos?: number | null;
  local?: string | null;
  detalhes?: string | null;
}

const DUAS_HORAS = 120;
const HORA = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

function formatoGoogle(data: Date): string {
  return data.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly request = inject(RequestService);
  private readonly feedback = inject(FeedbackService);

  conflitos(alvo: { instancia: number } | { evento: number }): Observable<Conflito[]> {
    const busca = 'instancia' in alvo ? `instancia=${alvo.instancia}` : `evento=${alvo.evento}`;
    return this.request.get<{ conflitos: Conflito[] }>(`/agenda/conflitos?${busca}`).pipe(
      map(({ conflitos }) => conflitos),
      catchError(() => of([])),
    );
  }

  async podeSeguir(conflitos: Conflito[], acao: string): Promise<boolean> {
    if (!conflitos.length) return true;
    const primeiro = conflitos[0];
    const outros = conflitos.length > 1 ? ` e mais ${conflitos.length - 1}` : '';
    return this.feedback.confirmar({
      titulo: 'Esse horário bate com outro compromisso',
      texto: `Você já tem "${primeiro.titulo}"${outros} em ${HORA.format(new Date(primeiro.inicio))}. Quer ${acao} mesmo assim?`,
      confirmar: `Sim, ${acao}`,
    });
  }

  abrirNoGoogle(compromisso: CompromissoNaAgenda): void {
    const inicio = new Date(compromisso.inicio);
    const fim = compromisso.fim
      ? new Date(compromisso.fim)
      : new Date(inicio.getTime() + (compromisso.duracaoMinutos || DUAS_HORAS) * 60000);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: compromisso.titulo,
      dates: `${formatoGoogle(inicio)}/${formatoGoogle(fim)}`,
      details: compromisso.detalhes || 'Reserva feita no Viajá.',
      location: compromisso.local || '',
      ctz: 'America/Sao_Paulo',
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener');
  }
}
