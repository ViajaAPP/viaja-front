import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { ValidarFormularioDirective } from '../../shared/directives/validar-formulario.directive';
import { TourService } from '../../shared/services/tour/tour.service';
import { CidadesService } from '../../shared/services/cidades/cidades.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { TourDetail, TourPayload } from '../../shared/enums/tour.model';
import { UFS } from '../../shared/config/tour.config';
import { CampoFotoComponent } from '../../shared/components/campo-foto/campo-foto.component';

@Component({
  selector: 'app-passeio-form',
  imports: [FormsModule, CampoFotoComponent, ValidarFormularioDirective],
  templateUrl: './passeio-form.component.html',
})
export class PasseioFormComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly feedback = inject(FeedbackService);
  private readonly tourService = inject(TourService);
  private readonly cidadesService = inject(CidadesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cidadeDigitada = new Subject<string>();

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
  enviandoCapa = signal(false);
  previaDaCapa = signal('');
  erro = signal('');
  cidadesSugeridas = signal<string[]>([]);

  ngOnInit(): void {
    this.cidadeDigitada
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) =>
          texto.trim().length < 2
            ? of([])
            : this.cidadesService.buscarCidades(texto.trim(), this.passeio.uf).pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cidades) => this.cidadesSugeridas.set(cidades.map((cidade) => cidade.name)));
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

  escolherCapa(arquivo: File): void {
    const anterior = this.passeio.photo;
    this.previaDaCapa.set(URL.createObjectURL(arquivo));
    this.enviandoCapa.set(true);
    this.erro.set('');
    this.tourService.enviarCapa(arquivo).subscribe({
      next: ({ photo }) => {
        this.passeio.photo = photo;
        this.limparPreviaDaCapa();
        this.enviandoCapa.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.passeio.photo = anterior;
        this.limparPreviaDaCapa();
        this.enviandoCapa.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos enviar a foto. Tente de novo.'));
      },
    });
  }

  removerCapa(): void {
    this.passeio.photo = '';
  }

  private limparPreviaDaCapa(): void {
    if (this.previaDaCapa()) URL.revokeObjectURL(this.previaDaCapa());
    this.previaDaCapa.set('');
  }

  salvar(): void {
    if (!this.passeio.photo) {
      this.erro.set('Escolha uma foto de capa para o passeio.');
      return;
    }
    this.passeio.cep = this.passeio.cep.replace(/\D/g, '');
    this.salvando.set(true);
    this.erro.set('');
    if (this.tourId) {
      this.tourService.editarPasseio(this.tourId, this.passeio).subscribe({
        next: () => {
          this.feedback.sucesso('Passeio atualizado.');
          this.navigationService.navigateTo('meus-passeios');
        },
        error: (error: HttpErrorResponse) => this.falhou(error),
      });
      return;
    }
    this.tourService.criarPasseio(this.passeio).subscribe({
      next: ({ tour_id }) => {
        this.feedback.sucesso('Passeio criado. Agora marque as datas.');
        this.navigationService.navigateToTour('passeio-gestao', tour_id);
      },
      error: (error: HttpErrorResponse) => this.falhou(error),
    });
  }

  buscarCidades(texto: string): void {
    this.cidadeDigitada.next(texto);
  }

  trocarUf(): void {
    this.cidadesSugeridas.set([]);
  }

  voltar(): void {
    this.navigationService.navigateTo('meus-passeios');
  }

  private falhou(error: HttpErrorResponse): void {
    this.salvando.set(false);
    this.erro.set(mensagemDeErro(error, 'Não conseguimos salvar o passeio.'));
  }
}
