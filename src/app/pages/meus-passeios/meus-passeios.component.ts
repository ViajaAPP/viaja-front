import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { TourService } from '../../shared/services/tour/tour.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { Tour } from '../../shared/enums/tour.model';

@Component({
  selector: 'app-meus-passeios',
  imports: [],
  templateUrl: './meus-passeios.component.html',
  styleUrl: './meus-passeios.component.scss',
})
export class MeusPasseiosComponent implements OnInit {
  readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);
  private readonly feedback = inject(FeedbackService);

  passeios = signal<Tour[]>([]);
  carregando = signal(true);
  erro = signal('');
  mudando = signal<number | null>(null);

  ngOnInit(): void {
    this.buscarPasseios();
  }

  buscarPasseios(): void {
    this.tourService.listarPasseiosGerenciados().subscribe({
      next: (passeios) => {
        this.carregando.set(false);
        this.passeios.set(passeios);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seus passeios.'));
      },
    });
  }

  ehDono(passeio: Tour): boolean {
    return passeio.created_by_id === this.facade.myUserId();
  }

  quantidadeDeDatas(passeio: Tour): number {
    return passeio.tour_instance?.length ?? 0;
  }

  async alternarPublicacao(passeio: Tour): Promise<void> {
    if (this.mudando()) return;
    if (passeio.published) {
      const confirmou = await this.feedback.confirmar({
        titulo: 'Tirar o passeio do ar?',
        texto: 'Ele some da busca e ninguém consegue pedir vaga até ser publicado de novo.',
        confirmar: 'Tirar do ar',
      });
      if (!confirmou) return;
    }
    this.mudando.set(passeio.id);
    this.tourService.publicarPasseio(passeio.id, !passeio.published).subscribe({
      next: () => {
        this.mudando.set(null);
        this.feedback.sucesso(passeio.published ? 'Passeio fora do ar.' : 'Passeio publicado.');
        this.buscarPasseios();
      },
      error: (error: HttpErrorResponse) => {
        this.mudando.set(null);
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos mudar a publicação.'));
      },
    });
  }

  novoPasseio(): void {
    this.navigationService.navigateToTour('passeio-form', null);
  }

  editar(passeio: Tour): void {
    this.navigationService.navigateToTour('passeio-form', passeio.id);
  }

  gerenciar(passeio: Tour): void {
    this.navigationService.navigateToTour('passeio-gestao', passeio.id);
  }

  verComoViajante(passeio: Tour): void {
    this.navigationService.navigateToTour('passeio', passeio.id);
  }

  voltar(): void {
    this.navigationService.navigateTo('perfil');
  }
}
