import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() dados: any;

  mostrarFiltros = signal(false);
  filtroSelecionado = signal('');

  tagsDisponiveis = computed(() => {
    if (!this.dados?.popularActivities) return [] as string[];
    const tags = new Set(this.dados.popularActivities.map((a: any) => a.tag as string));
    return Array.from(tags) as string[];
  });

  toggleFiltros(): void {
    this.mostrarFiltros.update(val => !val);
  }

  aplicarFiltro(filtro: string): void {
    this.filtroSelecionado.set(filtro);
    this.mostrarFiltros.set(false);
  }
}

