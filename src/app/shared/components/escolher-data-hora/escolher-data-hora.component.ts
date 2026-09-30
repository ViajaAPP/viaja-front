import { Component, computed, effect, input, output, signal } from '@angular/core';

interface Dia {
  data: Date;
  chave: string;
  numero: number;
  doMes: boolean;
  passado: boolean;
  hoje: boolean;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const HORARIOS = {
  Manhã: ['07:00', '08:00', '09:00', '10:00', '11:00'],
  Tarde: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  Noite: ['18:00', '19:00', '20:00'],
};

function chaveDoDia(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'app-escolher-data-hora',
  templateUrl: './escolher-data-hora.component.html',
  styleUrl: './escolher-data-hora.component.scss',
})
export class EscolherDataHoraComponent {
  valor = input('');
  mudou = output<string>();

  readonly semana = SEMANA;
  readonly periodos = Object.entries(HORARIOS);
  readonly hoje = new Date();

  mesVisivel = signal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));
  diaEscolhido = signal('');
  horaEscolhida = signal('');
  outroHorario = signal(false);

  tituloDoMes = computed(() => {
    const mes = this.mesVisivel();
    const nome = MESES[mes.getMonth()];
    return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${mes.getFullYear()}`;
  });

  podeVoltarMes = computed(() => {
    const mes = this.mesVisivel();
    return mes.getFullYear() > this.hoje.getFullYear() || mes.getMonth() > this.hoje.getMonth();
  });

  dias = computed<Dia[]>(() => {
    const mes = this.mesVisivel();
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1 - mes.getDay());
    const hojeZerado = new Date(this.hoje.getFullYear(), this.hoje.getMonth(), this.hoje.getDate());
    return Array.from({ length: 42 }, (_, i) => {
      const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      return {
        data,
        chave: chaveDoDia(data),
        numero: data.getDate(),
        doMes: data.getMonth() === mes.getMonth(),
        passado: data < hojeZerado,
        hoje: data.getTime() === hojeZerado.getTime(),
      };
    });
  });

  atalhos = computed(() => {
    const base = new Date(this.hoje.getFullYear(), this.hoje.getMonth(), this.hoje.getDate());
    const amanha = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    const sabado = new Date(base.getFullYear(), base.getMonth(), base.getDate() + ((6 - base.getDay() + 7) % 7 || 7));
    return [
      { rotulo: 'Hoje', chave: chaveDoDia(base) },
      { rotulo: 'Amanhã', chave: chaveDoDia(amanha) },
      { rotulo: 'Próximo sábado', chave: chaveDoDia(sabado) },
    ];
  });

  resumo = computed(() => {
    const dia = this.diaEscolhido();
    if (!dia) return '';
    const [ano, mes, numero] = dia.split('-').map(Number);
    const data = new Date(ano, mes - 1, numero);
    const texto = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const inicio = texto.charAt(0).toUpperCase() + texto.slice(1);
    return this.horaEscolhida() ? `${inicio} às ${this.horaEscolhida()}` : inicio;
  });

  constructor() {
    effect(() => {
      const valor = this.valor();
      if (!valor) {
        this.diaEscolhido.set('');
        this.horaEscolhida.set('');
        return;
      }
      const [dia, hora] = valor.split('T');
      this.diaEscolhido.set(dia);
      this.horaEscolhida.set((hora ?? '').slice(0, 5));
    });
  }

  mudarMes(passo: number): void {
    const mes = this.mesVisivel();
    this.mesVisivel.set(new Date(mes.getFullYear(), mes.getMonth() + passo, 1));
  }

  escolherDia(chave: string): void {
    this.diaEscolhido.set(chave);
    const [ano, mes] = chave.split('-').map(Number);
    this.mesVisivel.set(new Date(ano, mes - 1, 1));
    if (this.horaEscolhida() && this.horarioPassou(this.horaEscolhida())) this.horaEscolhida.set('');
    this.emitir();
  }

  escolherHora(hora: string): void {
    if (!hora || this.horarioPassou(hora)) return;
    this.horaEscolhida.set(hora);
    this.emitir();
  }

  horarioPassou(hora: string): boolean {
    if (this.diaEscolhido() !== chaveDoDia(this.hoje)) return false;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m <= this.hoje.getHours() * 60 + this.hoje.getMinutes();
  }

  private emitir(): void {
    this.mudou.emit(this.diaEscolhido() && this.horaEscolhida() ? `${this.diaEscolhido()}T${this.horaEscolhida()}` : '');
  }
}
