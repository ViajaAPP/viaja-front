import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { TourService } from '../../shared/services/tour/tour.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { TourDetail, TourPayload } from '../../shared/enums/tour.model';
import { UFS } from '../../shared/config/tour.config';

@Component({
  selector: 'app-passeio-form',
  imports: [FormsModule],
  templateUrl: './passeio-form.component.html',
})
export class PasseioFormComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly tourService = inject(TourService);

  readonly ufs = UFS;
  readonly tourId = this.facade.selectedTourId();

  passeio: TourPayload = {
    title: '',
    description: '',
    price: 0,
    estimated_duration_minutes: 60,
    meeting_point: '',
    photo: '',
    cep: '',
    uf: 'SP',
    city: '',
    neighborhood: '',
    street: '',
    number: '',
  };

  salvando = signal(false);
  erro = signal('');

  ngOnInit(): void {
    if (this.tourId) this.carregarPasseio(this.tourId);
  }

  carregarPasseio(tourId: number): void {
    this.tourService.buscarPasseio(tourId).subscribe({
      next: (passeio) => this.preencher(passeio),
      error: (error: HttpErrorResponse) =>
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar o passeio.')),
    });
  }

  preencher(passeio: TourDetail): void {
    const { cep, uf, city, neighborhood, street, number } = passeio.address ?? this.passeio;
    this.passeio = {
      title: passeio.title,
      description: passeio.description,
      price: passeio.price,
      estimated_duration_minutes: passeio.estimated_duration_minutes,
      meeting_point: passeio.meeting_point,
      photo: passeio.photo,
      cep,
      uf,
      city,
      neighborhood,
      street,
      number,
    };
  }

  salvar(): void {
    this.salvando.set(true);
    this.erro.set('');
    if (this.tourId) {
      this.tourService.editarPasseio(this.tourId, this.passeio).subscribe({
        next: () => this.navigationService.navigateTo('meus-passeios'),
        error: (error: HttpErrorResponse) => this.falhou(error),
      });
      return;
    }
    this.tourService.criarPasseio(this.passeio).subscribe({
      next: ({ tour_id }) => this.navigationService.navigateToTour('passeio-gestao', tour_id),
      error: (error: HttpErrorResponse) => this.falhou(error),
    });
  }

  voltar(): void {
    this.navigationService.navigateTo('meus-passeios');
  }

  private falhou(error: HttpErrorResponse): void {
    this.salvando.set(false);
    this.erro.set(mensagemDeErro(error, 'Não conseguimos salvar o passeio.'));
  }
}
