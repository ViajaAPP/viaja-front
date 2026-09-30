import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { FeedbackService } from '../../services/feedback/feedback.service';

@Component({
  selector: 'app-confirmacao',
  templateUrl: './confirmacao.component.html',
  styleUrl: './confirmacao.component.scss',
  host: { '(document:keydown.escape)': 'cancelar()' },
})
export class ConfirmacaoComponent {
  readonly feedback = inject(FeedbackService);
  private readonly botaoCancelar = viewChild<ElementRef<HTMLButtonElement>>('cancelarBotao');

  constructor() {
    effect(() => {
      if (this.feedback.confirmacao()) setTimeout(() => this.botaoCancelar()?.nativeElement.focus());
    });
  }

  cancelar(): void {
    if (this.feedback.confirmacao()) this.feedback.responder(false);
  }
}
