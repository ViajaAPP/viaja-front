import { Component, DestroyRef, ElementRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { LocaisService, LocalEncontrado } from '../../services/locais/locais.service';

@Component({
  selector: 'app-busca-local',
  templateUrl: './busca-local.component.html',
  styleUrl: './busca-local.component.scss',
  host: { '(document:pointerdown)': 'fecharSeForFora($event)', '(focusout)': 'aoSairDoFoco($event)' },
})
export class BuscaLocalComponent {
  private readonly locaisService = inject(LocaisService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  escolhido = output<LocalEncontrado>();

  texto = signal('');
  resultados = signal<LocalEncontrado[]>([]);
  buscando = signal(false);
  semResultado = signal(false);
  aberto = signal(false);
  private readonly digitado = new Subject<string>();

  constructor() {
    this.digitado
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => this.semResultado.set(false)),
        switchMap((texto) => {
          if (!texto.trim()) return of([]);
          this.buscando.set(true);
          return this.locaisService.buscar(texto.trim()).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((resultados) => {
        this.buscando.set(false);
        this.resultados.set(resultados);
        this.semResultado.set(this.texto().trim().length >= 3 && !resultados.length);
        this.aberto.set(true);
      });
  }

  digitar(texto: string): void {
    this.texto.set(texto);
    this.digitado.next(texto);
  }

  fecharSeForFora(evento: Event): void {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) this.aberto.set(false);
  }

  aoSairDoFoco(evento: FocusEvent): void {
    if (!this.elemento.nativeElement.contains(evento.relatedTarget as Node | null)) this.aberto.set(false);
  }

  escolher(local: LocalEncontrado): void {
    this.texto.set(local.nome || `${local.rua}, ${local.numero}`);
    this.aberto.set(false);
    this.escolhido.emit(local);
  }

  descricao(local: LocalEncontrado): string {
    return [local.rua && `${local.rua}${local.numero ? ', ' + local.numero : ''}`, local.bairro, local.cidade && `${local.cidade} - ${local.uf}`]
      .filter(Boolean)
      .join(' · ');
  }
}
