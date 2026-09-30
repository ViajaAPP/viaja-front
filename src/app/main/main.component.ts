import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from '../pages/welcome/welcome.component';
import { LoginComponent } from '../pages/login/login.component';
import { LoadingComponent } from '../shared/components/loading/loading.component';
import { SemConexaoComponent } from '../shared/components/sem-conexao/sem-conexao.component';
import { HomeComponent } from '../pages/home/home.component';
import { ChatComponent } from '../pages/chat/chat.component';
import { AppFacade } from '../shared/facade/app.facade';
import { BotaoNavComponent } from '../shared/components/botao-nav/botao-nav.component';
import { ChatMessageComponent } from '../pages/chat-message/chat-message.component';
import { RegistrarComponent } from '../pages/registrar/registrar.component';
import { PerfilComponent } from '../pages/perfil/perfil.component';
import { PasseioComponent } from '../pages/passeio/passeio.component';
import { MeusPasseiosComponent } from '../pages/meus-passeios/meus-passeios.component';
import { PasseioFormComponent } from '../pages/passeio-form/passeio-form.component';
import { PasseioGestaoComponent } from '../pages/passeio-gestao/passeio-gestao.component';
import { MinhasSolicitacoesComponent } from '../pages/minhas-solicitacoes/minhas-solicitacoes.component';
import { FavoritosComponent } from '../pages/favoritos/favoritos.component';
import { PerfilEditarComponent } from '../pages/perfil-editar/perfil-editar.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    ChatMessageComponent,
    WelcomeComponent,
    LoginComponent,
    BotaoNavComponent,
    LoadingComponent,
    SemConexaoComponent,
    HomeComponent,
    ChatComponent,
    RegistrarComponent,
    PerfilComponent,
    PasseioComponent,
    MeusPasseiosComponent,
    PasseioFormComponent,
    PasseioGestaoComponent,
    MinhasSolicitacoesComponent,
    FavoritosComponent,
    PerfilEditarComponent,
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
