import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from '../shared/components/loading/loading.component';
import { SemConexaoComponent } from '../shared/components/sem-conexao/sem-conexao.component';
import { AppFacade } from '../shared/facade/app.facade';
import { BotaoNavComponent } from '../shared/components/botao-nav/botao-nav.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    BotaoNavComponent,
    LoadingComponent,
    SemConexaoComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  facade = inject(AppFacade);

  ngOnInit() {
    this.facade.initializeApp();
  }
}
