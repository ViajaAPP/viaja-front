import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { ComAlteracoes } from '../../shared/guards/alteracoes.guard';
import { FeedbackService } from '../../shared/services/feedback/feedback.service';
import { ValidarFormularioDirective } from '../../shared/directives/validar-formulario.directive';
import { EventoService } from '../../shared/services/evento/evento.service';
import { CidadesService } from '../../shared/services/cidades/cidades.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { Evento, EventoPayload } from '../../shared/enums/evento.model';
import { UFS } from '../../shared/config/tour.config';
import { CampoFotoComponent } from '../../shared/components/campo-foto/campo-foto.component';
import { BuscaLocalComponent } from '../../shared/components/busca-local/busca-local.component';
import { MapaComponent } from '../../shared/components/mapa/mapa.component';
import { EscolherDataHoraComponent } from '../../shared/components/escolher-data-hora/escolher-data-hora.component';
import { LocaisService, LocalEncontrado } from '../../shared/services/locais/locais.service';
import { LocalizacaoService } from '../../shared/services/localizacao/localizacao.service';

function paraCampoLocal(iso: string): string {
  const data = new Date(iso);
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

@Component({
  selector: 'app-evento-form',
  imports: [FormsModule, CampoFotoComponent, ValidarFormularioDirective, BuscaLocalComponent, MapaComponent, EscolherDataHoraComponent],
  templateUrl: './evento-form.component.html',
})
export class EventoFormComponent implements OnInit, ComAlteracoes {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly feedback = inject(FeedbackService);
  private readonly eventoService = inject(EventoService);
  private readonly cidadesService = inject(CidadesService);
  private readonly locaisService = inject(LocaisService);
  private readonly localizacao = inject(LocalizacaoService);
  private readonly telas = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cidadeDigitada = new Subject<string>();

  readonly ufs = UFS;
  readonly eventoId = this.facade.selectedTourId();

  evento: EventoPayload & { inicio: string; termino: string } = {
    title: '',
    description: '',
    start_time: '',
    end_time: null,
    inicio: '',
    termino: '',
    place_name: '',
    price: 0,
    capacity: null,
    photo: '',
    photo_credit: null,
    cep: '',
    uf: 'SP',
    city: '',
    neighborhood: '',
    street: '',
    number: '',
    lat: null,
    lon: null,
  };

  status = signal<Evento['status'] | null>(null);
  localizando = signal(false);
  semLocal = signal(false);
  semData = signal(false);
  salvando = signal(false);
  enviandoCapa = signal(false);
  previaDaCapa = signal('');
  erro = signal('');
  cidadesSugeridas = signal<string[]>([]);
  private original = JSON.stringify(this.evento);
  private payloadOriginal: EventoPayload | null = null;
  private salvo = false;

  ngOnInit(): void {
    this.cidadeDigitada
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) =>
          texto.trim().length < 2
            ? of([])
            : this.cidadesService.buscarCidades(texto.trim(), this.evento.uf).pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cidades) => this.cidadesSugeridas.set(cidades.map((cidade) => cidade.name)));
    if (this.eventoId) this.carregar(this.eventoId);
  }

  carregar(id: number): void {
    this.eventoService.buscar(id).subscribe({
      next: (evento) => this.preencher(evento),
      error: (error: HttpErrorResponse) => this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar o evento.')),
    });
  }

  preencher(evento: Evento): void {
    const endereco = evento.address;
    this.status.set(evento.status);
    this.evento = {
      title: evento.title,
      description: evento.description ?? '',
      start_time: evento.start_time,
      end_time: evento.end_time,
      inicio: paraCampoLocal(evento.start_time),
      termino: evento.end_time ? paraCampoLocal(evento.end_time).slice(11) : '',
      place_name: evento.place_name ?? '',
      price: evento.price,
      capacity: evento.capacity,
      photo: evento.photo ?? '',
      photo_credit: evento.photo_credit,
      cep: endereco?.cep ?? '',
      uf: endereco?.uf ?? 'SP',
      city: endereco?.city ?? '',
      neighborhood: endereco?.neighborhood ?? '',
      street: endereco?.street ?? '',
      number: endereco?.number ?? '',
      lat: endereco?.lat ?? null,
      lon: endereco?.lon ?? null,
    };
    this.original = JSON.stringify(this.evento);
    this.payloadOriginal = this.montarPayload();
    this.telas.markForCheck();
  }

  escolherInicio(valor: string): void {
    this.evento.inicio = valor;
    if (valor) this.semData.set(false);
  }

  escolherCapa(arquivo: File): void {
    const anterior = this.evento.photo;
    this.previaDaCapa.set(URL.createObjectURL(arquivo));
    this.enviandoCapa.set(true);
    this.erro.set('');
    this.eventoService.enviarFoto(arquivo).subscribe({
      next: ({ photo }) => {
        this.evento.photo = photo;
        this.limparPreviaDaCapa();
        this.enviandoCapa.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.evento.photo = anterior;
        this.limparPreviaDaCapa();
        this.enviandoCapa.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos enviar a foto. Tente de novo.'));
      },
    });
  }

  removerCapa(): void {
    this.evento.photo = '';
  }

  usarLocal(local: LocalEncontrado): void {
    this.semLocal.set(false);
    this.evento = {
      ...this.evento,
      cep: local.cep || this.evento.cep,
      uf: local.uf || this.evento.uf,
      city: local.cidade || this.evento.city,
      neighborhood: local.bairro || this.evento.neighborhood,
      street: local.rua || this.evento.street,
      number: local.numero || this.evento.number,
      lat: local.lat,
      lon: local.lon,
    };
    if (!this.evento.place_name && local.nome) this.evento.place_name = local.nome;
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
    this.evento = { ...this.evento, lat: ponto.lat, lon: ponto.lon };
    this.telas.markForCheck();
    this.locaisService.enderecoDoPonto(ponto.lat, ponto.lon).subscribe({
      next: (local) => {
        if (local) this.usarLocal({ ...local, lat: ponto.lat, lon: ponto.lon });
      },
      error: () => {},
    });
  }

  buscarCidades(texto: string): void {
    this.cidadeDigitada.next(texto);
  }

  trocarUf(): void {
    this.cidadesSugeridas.set([]);
  }

  salvar(): void {
    if (!this.evento.inicio) {
      this.semData.set(true);
      document.getElementById('quando')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (this.evento.lat == null || this.evento.lon == null) {
      this.semLocal.set(true);
      document.getElementById('busca-local')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!this.evento.photo) {
      this.erro.set('Escolha uma foto de capa para o evento.');
      return;
    }
    const payload = this.montarPayload();
    const mudancas = this.soOQueMudou(payload);
    if (this.eventoId && !Object.keys(mudancas).length) {
      this.salvo = true;
      this.navigationService.navigateTo('meus-eventos');
      return;
    }
    this.salvando.set(true);
    this.erro.set('');
    const pedido: Observable<{ id?: number; status?: string }> = this.eventoId
      ? this.eventoService.editar(this.eventoId, mudancas)
      : this.eventoService.criar(payload);
    pedido.subscribe({
      next: (resposta) => {
        this.salvo = true;
        const foiParaAnalise = !this.eventoId || (resposta.status === 'IN_REVIEW' && this.status() !== 'IN_REVIEW');
        this.feedback.sucesso(foiParaAnalise
          ? 'Evento enviado para análise. Você recebe um aviso assim que ele entrar no ar.'
          : 'Evento salvo.');
        this.navigationService.navigateTo('meus-eventos');
      },
      error: (error: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos salvar o evento.'));
      },
    });
  }

  private montarPayload(): EventoPayload {
    const { inicio, termino, ...dados } = this.evento;
    const comeco = new Date(inicio);
    let fim: Date | null = null;
    if (termino) {
      fim = new Date(`${inicio.slice(0, 10)}T${termino}`);
      if (fim <= comeco) fim.setDate(fim.getDate() + 1);
    }
    return {
      ...dados,
      cep: (dados.cep ?? '').replace(/\D/g, ''),
      start_time: comeco.toISOString(),
      end_time: fim ? fim.toISOString() : null,
      price: Number(dados.price) || 0,
      capacity: dados.capacity ? Number(dados.capacity) : null,
    };
  }

  private soOQueMudou(payload: EventoPayload): Partial<EventoPayload> {
    const antes = this.payloadOriginal;
    if (!antes) return payload;
    const endereco: (keyof EventoPayload)[] = ['cep', 'uf', 'city', 'neighborhood', 'street', 'number', 'lat', 'lon'];
    const mudou = (chave: keyof EventoPayload) => payload[chave] !== antes[chave];
    const mudancas: Partial<EventoPayload> = {};
    (Object.keys(payload) as (keyof EventoPayload)[])
      .filter((chave) => !endereco.includes(chave) && mudou(chave))
      .forEach((chave) => Object.assign(mudancas, { [chave]: payload[chave] }));
    if (endereco.some(mudou)) endereco.forEach((chave) => Object.assign(mudancas, { [chave]: payload[chave] }));
    return mudancas;
  }

  temAlteracoes(): boolean {
    return !this.salvo && JSON.stringify(this.evento) !== this.original;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (this.temAlteracoes()) evento.preventDefault();
  }

  voltar(): void {
    this.navigationService.voltar('meus-eventos');
  }

  private limparPreviaDaCapa(): void {
    if (this.previaDaCapa()) URL.revokeObjectURL(this.previaDaCapa());
    this.previaDaCapa.set('');
  }
}
