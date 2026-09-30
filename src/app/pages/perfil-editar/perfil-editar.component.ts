import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation';
import { ComAlteracoes } from '../../shared/guards/alteracoes.guard';
import { DadosClienteService } from '../../shared/services/dados-cliente/dados-cliente.service';
import { mensagemDeErro } from '../../shared/services/request/request-error';
import { Perfil } from '../../shared/enums/user.model';
import { ROLE_LABELS } from '../../shared/config/tour.config';
import { CampoFotoComponent } from '../../shared/components/campo-foto/campo-foto.component';
import { CartaoPerfilComponent } from '../../shared/components/cartao-perfil/cartao-perfil.component';

type CampoDoPerfil = 'first_name' | 'last_name' | 'phone';

@Component({
  selector: 'app-perfil-editar',
  imports: [FormsModule, CampoFotoComponent, CartaoPerfilComponent],
  templateUrl: './perfil-editar.component.html',
  styleUrl: './perfil-editar.component.scss',
})
export class PerfilEditarComponent implements OnInit, ComAlteracoes {
  private readonly facade = inject(AppFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly dadosClienteService = inject(DadosClienteService);

  perfil = signal<Perfil | null>(null);
  nome = signal('');
  sobrenome = signal('');
  telefone = signal('');
  foto = signal('');
  enviandoFoto = signal(false);
  salvando = signal(false);
  erro = signal('');
  sucesso = signal('');
  errosDosCampos = signal<Partial<Record<CampoDoPerfil, string>>>({});
  private salvo = false;

  nomeCompleto = computed(() => `${this.nome()} ${this.sobrenome()}`.trim());
  tipoDeConta = computed(() => {
    const role = this.perfil()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  ngOnInit(): void {
    this.facade.setLoading(false);
    this.dadosClienteService.getPerfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.nome.set(perfil.first_name);
        this.sobrenome.set(perfil.last_name);
        this.telefone.set(perfil.phone ?? '');
        this.foto.set(perfil.photo);
      },
      error: (error: HttpErrorResponse) =>
        this.erro.set(mensagemDeErro(error, 'Não conseguimos carregar seu perfil.')),
    });
  }

  alterar(campo: CampoDoPerfil, valor: string): void {
    const sinais = { first_name: this.nome, last_name: this.sobrenome, phone: this.telefone };
    sinais[campo].set(valor);
    this.sucesso.set('');
    if (this.errosDosCampos()[campo]) {
      this.errosDosCampos.update((erros) => ({ ...erros, [campo]: undefined }));
    }
  }

  escolherFoto(arquivo: File): void {
    const anterior = this.foto();
    const previa = URL.createObjectURL(arquivo);
    this.foto.set(previa);
    this.enviandoFoto.set(true);
    this.erro.set('');
    this.dadosClienteService.enviarFoto(arquivo).subscribe({
      next: ({ photo }) => {
        URL.revokeObjectURL(previa);
        this.foto.set(photo);
        this.enviandoFoto.set(false);
        this.dadosClienteService.limparCache();
      },
      error: (error: HttpErrorResponse) => {
        URL.revokeObjectURL(previa);
        this.foto.set(anterior);
        this.enviandoFoto.set(false);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos enviar sua foto. Tente de novo.'));
      },
    });
  }

  removerFoto(): void {
    const anterior = this.foto();
    this.foto.set('');
    this.dadosClienteService.removerFoto().subscribe({
      next: () => this.dadosClienteService.limparCache(),
      error: (error: HttpErrorResponse) => {
        this.foto.set(anterior);
        this.erro.set(mensagemDeErro(error, 'Não conseguimos remover sua foto. Tente de novo.'));
      },
    });
  }

  salvar(): void {
    const erros: Partial<Record<CampoDoPerfil, string>> = {};
    if (!this.nome().trim()) erros.first_name = 'Conta pra gente seu nome';
    if (!this.sobrenome().trim()) erros.last_name = 'Conta pra gente seu sobrenome';
    this.errosDosCampos.set(erros);
    if (Object.keys(erros).length) return;

    this.salvando.set(true);
    this.erro.set('');
    this.dadosClienteService
      .atualizarPerfil({
        first_name: this.nome().trim(),
        last_name: this.sobrenome().trim(),
        phone: this.telefone().trim(),
      })
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.salvo = true;
          this.sucesso.set('Perfil salvo.');
          this.dadosClienteService.limparCache();
          setTimeout(() => this.voltar(), 900);
        },
        error: (error: HttpErrorResponse) => {
          this.salvando.set(false);
          this.errosDosCampos.set(error.error?.fields ?? {});
          this.erro.set(mensagemDeErro(error, 'Não conseguimos salvar seu perfil. Tente de novo.'));
        },
      });
  }

  temAlteracoes(): boolean {
    const perfil = this.perfil();
    if (!perfil || this.salvo) return false;
    return this.nome() !== perfil.first_name
      || this.sobrenome() !== perfil.last_name
      || this.telefone() !== (perfil.phone ?? '');
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (this.temAlteracoes()) evento.preventDefault();
  }

  voltar(): void {
    this.navigationService.voltar('perfil');
  }
}
