import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
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

  passeios = signal<Tour[]>([]);
  carregando = signal(true);
  erro = signal('');

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

  alternarPublicacao(passeio: Tour): void {
    this.erro.set('');
    this.tourService.publicarPasseio(passeio.id, !passeio.published).subscribe({
      next: () => this.buscarPasseios(),
      error: (error: HttpErrorResponse) =>
        this.erro.set(mensagemDeErro(error, 'Não conseguimos mudar a publicação.')),
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
