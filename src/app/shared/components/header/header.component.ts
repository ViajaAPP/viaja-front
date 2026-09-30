import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AvisosService } from '../../services/avisos/avisos.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly avisos = inject(AvisosService);

  @Input() dados: any;
  @Input() mostrarBusca = true;

  abrirAvisos(): void {
    this.router.navigateByUrl('/avisos');
  }

  abrirBusca(): void {
    this.router.navigateByUrl('/buscar');
  }

  abrirFiltros(): void {
    this.router.navigate(['/buscar/resultados'], { queryParams: { filtros: 1 } });
  }
}
