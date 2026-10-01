import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { EventoService } from '../../shared/services/evento/evento.service';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { Evento } from '../../shared/enums/evento.model';
import { PRICE_FORMAT } from '../../shared/config/tour.config';
import { FalhaCarregarComponent } from '../../shared/components/falha-carregar/falha-carregar.component';

registerLocaleData(localePt, 'pt-BR');

@Component({
  selector: 'app-analise',
  imports: [DatePipe, FormsModule, FalhaCarregarComponent],
  templateUrl: './analise.component.html',
  styleUrls: ['../painel/painel.component.scss', './analise.component.scss'],
})
export class AnaliseComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly eventoService = inject(EventoService);
  private readonly feedback = inject(FeedbackService);

  eventos = signal<Evento[]>([]);
  carregando = signal(true);
  erro = signal('');
  devolvendo = signal<number | null>(null);
  enviando = signal<number | null>(null);
  motivo = '';

  ngOnInit(): void {
    this.facade.setLoading(false);
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.eventoService.paraAnalise().subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
        this.carregando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar a fila de análise.'));
      },
    });
  }

  formatarPreco(preco: number): string {
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  endereco(evento: Evento): string {
    const endereco = evento.address;
    if (!endereco) return '';
    return [endereco.street, endereco.neighborhood, `${endereco.city} - ${endereco.uf}`].filter(Boolean).join(', ');
  }

  abrirDevolucao(evento: Evento): void {
    this.motivo = '';
    this.devolvendo.set(evento.id);
  }

  aprovar(evento: Evento): void {
    this.responder(evento, true, '');
  }

  devolver(evento: Evento): void {
    const motivo = this.motivo.trim();
    if (!motivo) return;
    this.responder(evento, false, motivo);
  }

  voltar(): void {
    this.navigationService.voltar('perfil');
  }

  private responder(evento: Evento, aprovar: boolean, motivo: string): void {
    this.enviando.set(evento.id);
    this.eventoService.analisar(evento.id, aprovar, motivo).subscribe({
      next: () => {
        this.enviando.set(null);
        this.devolvendo.set(null);
        this.eventos.update((eventos) => eventos.filter((e) => e.id !== evento.id));
        this.feedback.sucesso(aprovar ? 'Evento aprovado. Ele já está no ar.' : 'Evento devolvido. A pessoa recebe o motivo num aviso.');
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(null);
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos salvar a análise. Tente de novo.'));
      },
    });
  }
}
