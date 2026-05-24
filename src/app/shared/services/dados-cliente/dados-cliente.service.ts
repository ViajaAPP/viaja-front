import { Injectable, inject } from '@angular/core';
import { RequestService } from '../request/request.service';
import { HomeResponse } from '../../enums/home.model';
import { APP_CONFIG } from '../../config/app.config';
import { HOME_MOCK } from '../../mock/home.mock';
import { Observable, of, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ChatMessage, ChatResponse } from '../../enums/chat.model';
import { CHAT_MOCK, CHAT_MESSAGE_MOCK } from '../../mock/chat.mock';

@Injectable({ providedIn: 'root' })
export class DadosClienteService {
  private request = inject(RequestService);
  private homeRequest$?: Observable<HomeResponse>;
  private chatRequest$?: Observable<ChatMessage>;

  getHome(): Observable<HomeResponse> {
    if (APP_CONFIG.MOCK) {
      if (!this.homeRequest$) {
        console.log('<<DADOS HOME MOCK>>');
        this.homeRequest$ = of(HOME_MOCK).pipe(
          tap((response) => console.log('DadosClienteService getHome mock response:', response)),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      }

      return this.homeRequest$;
    }

    if (!this.homeRequest$) {
      console.log('<<DADOS HOME REAL>>');
      this.homeRequest$ = this.request.post<HomeResponse>('/pages/home').pipe(
        tap((response) => console.log('DadosClienteService getHome response:', response)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.homeRequest$;
  }

  getChatPage(): Observable<ChatResponse> {
    if (APP_CONFIG.MOCK) {
      console.log('<<DADOS CHAT PAGE MOCK>>');
      return of(CHAT_MOCK).pipe(
        tap((response) => console.log('DadosClienteService getChatPage mock response:', response))
      );
    }

    return this.request.post<ChatResponse>('/pages/chats').pipe(
      tap((response) => console.log('DadosClienteService getChatPage response:', response))
    );
  }

  getChat(chat_id: number): Observable<ChatMessage> {
    console.log(chat_id);

    if (APP_CONFIG.MOCK) {
      console.log('<<DADOS CHAT MESSAGE MOCK>>');
      return of(CHAT_MESSAGE_MOCK).pipe(
        tap((response) => console.log('DadosClienteService getChat mock response:', response))
      );
    }

    return this.request.post<ChatMessage>('/pages/chat', { chat_id } );
  }
}

