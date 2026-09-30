import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from '../shared/components/loading/loading.component';
import { SemConexaoComponent } from '../shared/components/sem-conexao/sem-conexao.component';
import { AppFacade } from '../shared/facade/app.facade';
import { BotaoNavComponent } from '../shared/components/botao-nav/botao-nav.component';
import { ConfirmacaoComponent } from '../shared/components/confirmacao/confirmacao.component';
import { AvisoComponent } from '../shared/components/aviso/aviso.component';
import { AvisosService } from '../shared/services/avisos/avisos.service';
import { LayoutService } from '../shared/services/layout/layout.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    BotaoNavComponent,
    LoadingComponent,
    SemConexaoComponent,
    ConfirmacaoComponent,
    AvisoComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  facade = inject(AppFacade);
  private readonly avisos = inject(AvisosService);
  readonly layout = inject(LayoutService);

  ngOnInit() {
    this.facade.initializeApp();
    this.avisos.iniciar();
  }
}
