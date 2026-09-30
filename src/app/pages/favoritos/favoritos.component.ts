import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { FavoritoService } from '../../shared/services/favorito/favorito.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { Activity } from '../../shared/enums/home.model';
import { BotaoFavoritoComponent } from '../../shared/components/botao-favorito/botao-favorito.component';

@Component({
  selector: 'app-favoritos',
  imports: [BotaoFavoritoComponent],
  templateUrl: './favoritos.component.html',
  styleUrl: './favoritos.component.scss',
})
export class FavoritosComponent implements OnInit {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly favoritoService = inject(FavoritoService);

  passeios = signal<Activity[]>([]);
  carregando = signal(true);
  erro = signal('');

  ngOnInit(): void {
    this.facade.setLoading(false);
    this.favoritoService.listarFavoritos().subscribe({
      next: ({ tours }) => {
        this.carregando.set(false);
        this.passeios.set(tours);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seus favoritos.'));
      },
    });
  }

  aoAlterar(tourId: string, favorito: boolean): void {
    if (!favorito) this.passeios.update((lista) => lista.filter((passeio) => passeio.id !== tourId));
  }

  abrirPasseio(tourId: string): void {
    this.navigationService.navigateToTour('passeio', Number(tourId));
  }

  voltar(): void {
    this.navigationService.voltar('home');
  }
}
