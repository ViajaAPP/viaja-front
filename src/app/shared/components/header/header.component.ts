import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() dados: any;

  mostrarFiltros = signal(false);
  filtroSelecionado = signal('');

  tagsDisponiveis = computed(() => {
    if (!this.dados?.popularActivities) return [] as string[];
    const tags = new Set(this.dados.popularActivities.map((a: any) => a.tag as string));
    return Array.from(tags) as string[];
  });

  ngOnInit(): void {
    console.log(this.dados);
    console.log('Tags disponíveis:', this.tagsDisponiveis());
  }

  toggleFiltros(): void {
    this.mostrarFiltros.update(val => !val);
  }

  aplicarFiltro(filtro: string): void {
    this.filtroSelecionado.set(filtro);
    console.log('Filtro aplicado:', filtro);
    this.mostrarFiltros.set(false);
  }
}

