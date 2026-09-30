import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { ComAlteracoes } from '../../shared/guards/alteracoes.guard';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { ValidarFormularioDirective } from '../../shared/directives/validar-formulario.directive';
import { TourService } from '../../shared/services/tour/tour.service';
import { CidadesService } from '../../shared/services/cidades/cidades.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { TourDetail, TourPayload, TourPhoto } from '../../shared/enums/tour.model';
import { UFS } from '../../shared/config/tour.config';
import { CampoFotoComponent } from '../../shared/components/campo-foto/campo-foto.component';
import { BuscaLocalComponent } from '../../shared/components/busca-local/busca-local.component';
import { MapaComponent } from '../../shared/components/mapa/mapa.component';
import { LocaisService, LocalEncontrado } from '../../shared/services/locais/locais.service';
import { LocalizacaoService } from '../../shared/services/localizacao/localizacao.service';

@Component({
  selector: 'app-passeio-form',
  imports: [FormsModule, CampoFotoComponent, ValidarFormularioDirective, BuscaLocalComponent, MapaComponent],
  templateUrl: './passeio-form.component.html',
})
export class PasseioFormComponent implements OnInit, ComAlteracoes {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly feedback = inject(FeedbackService);
  private readonly tourService = inject(TourService);
  private readonly cidadesService = inject(CidadesService);
  private readonly locaisService = inject(LocaisService);
  private readonly localizacao = inject(LocalizacaoService);
  private readonly telas = inject(ChangeDetectorRef);
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
    lat: null,
    lon: null,
    photo_credit: null,
  };

  fotos = signal<TourPhoto[]>([]);
  localizando = signal(false);
  semLocal = signal(false);
  enviandoFoto = signal(false);
  readonly limiteDeFotos = 10;

  salvando = signal(false);
  enviandoCapa = signal(false);
  previaDaCapa = signal('');
  erro = signal('');
  cidadesSugeridas = signal<string[]>([]);
  private original = JSON.stringify(this.passeio);
  private salvo = false;

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
    const { cep, uf, city, neighborhood, street, number, lat, lon } = passeio.address ?? this.passeio;
    this.fotos.set(passeio.photos ?? []);
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
      lat: lat ?? null,
      lon: lon ?? null,
      photo_credit: passeio.photo_credit ?? null,
    };
    this.original = JSON.stringify(this.passeio);
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

  usarLocal(local: LocalEncontrado): void {
    this.semLocal.set(false);
    this.passeio = {
      ...this.passeio,
      cep: local.cep || this.passeio.cep,
      uf: local.uf || this.passeio.uf,
      city: local.cidade || this.passeio.city,
      neighborhood: local.bairro || this.passeio.neighborhood,
      street: local.rua || this.passeio.street,
      number: local.numero || this.passeio.number,
      lat: local.lat,
      lon: local.lon,
    };
    if (!this.passeio.meeting_point && local.nome) this.passeio.meeting_point = local.nome;
    this.telas.markForCheck();
  }

  usarMinhaLocalizacao(): void {
    this.localizando.set(true);
    let ultima: { lat: number; lon: number } | null = null;
    this.localizacao.acompanhar().subscribe({
      next: (posicao) => (ultima = posicao),
      complete: () => {
        this.localizando.set(false);
        if (ultima) this.moverPino(ultima);
      },
      error: (falha) => {
        this.localizando.set(false);
        this.feedback.erro(falha === 'sem-permissao'
          ? 'O navegador não liberou sua localização. Busque pelo nome ou toque no mapa.'
          : 'Não conseguimos achar sua localização agora.');
      },
    });
  }

  moverPino(ponto: { lat: number; lon: number }): void {
    this.semLocal.set(false);
    this.passeio = { ...this.passeio, lat: ponto.lat, lon: ponto.lon };
    this.telas.markForCheck();
    this.locaisService.enderecoDoPonto(ponto.lat, ponto.lon).subscribe({
      next: (local) => {
        if (local) this.usarLocal({ ...local, lat: ponto.lat, lon: ponto.lon });
      },
      error: () => {},
    });
  }

  adicionarFoto(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo || !this.tourId) return;
    this.enviandoFoto.set(true);
    this.tourService.enviarFotoDaGaleria(this.tourId, arquivo).subscribe({
      next: (foto) => {
        this.enviandoFoto.set(false);
        this.fotos.update((fotos) => [...fotos, foto]);
        this.feedback.sucesso('Foto adicionada.');
      },
      error: (error: HttpErrorResponse) => {
        this.enviandoFoto.set(false);
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos enviar a foto. Tente de novo.'));
      },
    });
  }

  async removerFoto(foto: TourPhoto): Promise<void> {
    if (!this.tourId) return;
    const confirmou = await this.feedback.confirmar({
      titulo: 'Tirar essa foto do passeio?',
      texto: 'Ela sai da galeria na hora.',
      confirmar: 'Tirar foto',
      perigo: true,
    });
    if (!confirmou) return;
    this.tourService.removerFotoDaGaleria(this.tourId, foto.id).subscribe({
      next: () => {
        this.fotos.update((fotos) => fotos.filter((f) => f.id !== foto.id));
        this.feedback.sucesso('Foto removida.');
      },
      error: (error: HttpErrorResponse) =>
        this.feedback.erro(mensagemDeErro(error, 'Não conseguimos remover a foto. Tente de novo.')),
    });
  }

  private limparPreviaDaCapa(): void {
    if (this.previaDaCapa()) URL.revokeObjectURL(this.previaDaCapa());
    this.previaDaCapa.set('');
  }

  salvar(): void {
    if (this.passeio.lat == null || this.passeio.lon == null) {
      this.semLocal.set(true);
      document.getElementById('busca-local')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
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
          this.salvo = true;
          this.feedback.sucesso('Passeio atualizado.');
          this.navigationService.navigateTo('meus-passeios');
        },
        error: (error: HttpErrorResponse) => this.falhou(error),
      });
      return;
    }
    this.tourService.criarPasseio(this.passeio).subscribe({
      next: ({ tour_id }) => {
        this.salvo = true;
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

  temAlteracoes(): boolean {
    return !this.salvo && JSON.stringify(this.passeio) !== this.original;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (this.temAlteracoes()) evento.preventDefault();
  }

  voltar(): void {
    this.navigationService.voltar('meus-passeios');
  }

  private falhou(error: HttpErrorResponse): void {
    this.salvando.set(false);
    this.erro.set(mensagemDeErro(error, 'Não conseguimos salvar o passeio.'));
  }
}
