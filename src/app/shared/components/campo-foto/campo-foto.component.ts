import { Component, computed, input, output, signal } from '@angular/core';

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-campo-foto',
  imports: [],
  templateUrl: './campo-foto.component.html',
  styleUrl: './campo-foto.component.scss',
})
export class CampoFotoComponent {
  foto = input('');
  formato = input<'redondo' | 'capa'>('redondo');
  enviando = input(false);
  escolhida = output<File>();
  removida = output<void>();

  erro = signal('');
  readonly idDoCampo = `campo-foto-${Math.random().toString(36).slice(2, 9)}`;
  readonly tiposAceitos = TIPOS_ACEITOS.join(',');
  textoDoBotao = computed(() => {
    if (this.enviando()) return 'Enviando...';
    if (this.formato() === 'capa') return this.foto() ? 'Trocar capa' : 'Adicionar capa';
    return this.foto() ? 'Trocar foto' : 'Adicionar foto';
  });

  aoEscolher(event: Event): void {
    const campo = event.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo) return;

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      this.erro.set('Escolha uma foto em JPG, PNG ou WEBP.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      this.erro.set('A foto pode ter no máximo 5 MB.');
      return;
    }
    this.erro.set('');
    this.escolhida.emit(arquivo);
  }

  remover(): void {
    this.erro.set('');
    this.removida.emit();
  }
}
