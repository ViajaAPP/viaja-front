import { Injectable, signal } from '@angular/core';

export interface PedidoDeConfirmacao {
  titulo: string;
  texto: string;
  confirmar: string;
  perigo?: boolean;
}

export interface Aviso {
  texto: string;
  tipo: 'sucesso' | 'erro';
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly confirmacao = signal<PedidoDeConfirmacao | null>(null);
  readonly aviso = signal<Aviso | null>(null);
  private resposta?: (confirmou: boolean) => void;
  private sumirAviso?: ReturnType<typeof setTimeout>;

  confirmar(pedido: PedidoDeConfirmacao): Promise<boolean> {
    this.resposta?.(false);
    this.confirmacao.set(pedido);
    return new Promise((resolve) => (this.resposta = resolve));
  }

  responder(confirmou: boolean): void {
    this.confirmacao.set(null);
    this.resposta?.(confirmou);
    this.resposta = undefined;
  }

  sucesso(texto: string): void {
    this.mostrar({ texto, tipo: 'sucesso' });
  }

  erro(texto: string): void {
    this.mostrar({ texto, tipo: 'erro' });
  }

  private mostrar(aviso: Aviso): void {
    clearTimeout(this.sumirAviso);
    this.aviso.set(aviso);
    this.sumirAviso = setTimeout(() => this.aviso.set(null), aviso.tipo === 'erro' ? 6000 : 3500);
  }
}
