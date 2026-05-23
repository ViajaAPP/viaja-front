import { Injectable, inject } from '@angular/core';
import { RequestService } from '../request/request.service';
import { HomeResponse } from '../../enums/home.model';
import { HOME_MOCK } from '../../mock/home.mock';
import { Observable, of, shareReplay } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ChatMessage, ChatResponse } from '../../enums/chat.model';

@Injectable({ providedIn: 'root' })
export class DadosClienteService {
  private request = inject(RequestService);
  private homeRequest$?: Observable<HomeResponse>;
  private chatRequest$?: Observable<ChatMessage>;

  getHome(): Observable<HomeResponse> {
    if (!this.homeRequest$) {
      this.homeRequest$ = this.request.post<HomeResponse>('/pages/home').pipe(
        tap((response) => console.log('DadosClienteService getHome response:', response)),
        catchError((error) => {
          console.error('Error fetching home data:', error);
          return of(HOME_MOCK);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.homeRequest$;
  }

  getChatPage(): Observable<ChatResponse> {
    return this.request.post<ChatResponse>('/pages/chats');
  }

  getChat(chatId: number): Observable<ChatMessage> {
    console.log(chatId);
    return this.request.post<ChatMessage>('/pages/chats', chatId )
  }
}

