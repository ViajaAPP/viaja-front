import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { FeedbackService } from '../services/feedback/feedback.service';

export interface ComAlteracoes {
  temAlteracoes(): boolean;
}

export const alteracoesGuard: CanDeactivateFn<ComAlteracoes> = (componente) => {
  if (!componente.temAlteracoes()) return true;
  return inject(FeedbackService).confirmar({
    titulo: 'Sair sem salvar?',
    texto: 'O que você mudou aqui ainda não foi salvo e vai se perder.',
    confirmar: 'Sair sem salvar',
    perigo: true,
  });
};
