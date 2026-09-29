import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from '../pages/welcome/welcome.component';
import { LoginComponent } from '../pages/login/login.component';
import { LoadingComponent } from '../shared/components/loading/loading.component';
import { HomeComponent } from '../pages/home/home.component';
import { ChatComponent } from '../pages/chat/chat.component';
import { AppFacade } from '../shared/facade/app.facade';
import { BotaoNavComponent } from '../shared/components/botao-nav/botao-nav.component';
import { ChatMessageComponent } from '../pages/chat-message/chat-message.component';
import { RegistrarComponent } from '../pages/registrar/registrar.component';

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
    HomeComponent,
    ChatComponent,
    RegistrarComponent,
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
