import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, RouteReuseStrategy } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { conexaoInterceptor } from './shared/interceptors/conexao.interceptor';
import { sessaoInterceptor } from './shared/interceptors/sessao.interceptor';
import { RotaReusoStrategy } from './shared/guards/rota-reuso.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, sessaoInterceptor, conexaoInterceptor])),
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: RotaReusoStrategy },
  ],
};
