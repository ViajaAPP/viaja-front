import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { CidadeDoRoteiro, ParadaDoRoteiro, Roteiro, RoteiroService } from '../../shared/services/roteiro/roteiro.service';
import { AgendaService } from '../../shared/services/agenda/agenda.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { PRICE_FORMAT } from '../../shared/config/tour.config';

registerLocaleData(localePt, 'pt-BR');

function hojeNoBrasil(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

@Component({
  selector: 'app-roteiro',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './roteiro.component.html',
  styleUrl: './roteiro.component.scss',
})
export class RoteiroComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly roteiroService = inject(RoteiroService);
  private readonly agenda = inject(AgendaService);

  readonly hoje = hojeNoBrasil();
  readonly opcoesDeDias = [1, 2, 3, 4];
  cidades = signal<CidadeDoRoteiro[]>([]);
  cidade = signal('');
  inicio = signal(this.hoje);
  dias = signal(2);
  roteiro = signal<Roteiro | null>(null);
  montando = signal(false);
  erro = signal('');

  totalDeParadas = computed(() => this.roteiro()?.dias.reduce((total, dia) => total + dia.itens.length, 0) ?? 0);

  ngOnInit(): void {
    this.facade.setLoading(false);
    this.roteiroService.cidades().subscribe({
      next: (cidades) => {
        this.cidades.set(cidades);
        if (cidades.length && !this.cidade()) this.cidade.set(this.chave(cidades[0]));
      },
      error: () => this.cidades.set([]),
    });
  }

  chave(cidade: CidadeDoRoteiro): string {
    return `${cidade.nome}|${cidade.uf}`;
  }

  montar(): void {
    const [nome, uf] = this.cidade().split('|');
    if (!nome || !uf || this.montando()) return;
    this.montando.set(true);
    this.erro.set('');
    this.roteiroService.montar(nome, uf, this.inicio(), this.dias()).subscribe({
      next: (roteiro) => {
        this.montando.set(false);
        this.roteiro.set(roteiro);
      },
      error: (error: HttpErrorResponse) => {
        this.montando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos montar o roteiro agora. Tente de novo.'));
      },
    });
  }

  formatarPreco(preco: number | null): string {
    if (preco == null) return '';
    return preco > 0 ? PRICE_FORMAT.format(preco) : 'Gratuito';
  }

  abrir(parada: ParadaDoRoteiro): void {
    this.navigationService.navigateToTour(parada.tipo === 'passeio' ? 'passeio' : 'evento', parada.id);
  }

  naAgenda(parada: ParadaDoRoteiro): void {
    this.agenda.abrirNoGoogle({
      titulo: parada.titulo,
      inicio: parada.inicio,
      fim: parada.fim,
      local: parada.lugar,
      detalhes: 'Parada do roteiro que o Viajá montou para você.',
    });
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }
}
