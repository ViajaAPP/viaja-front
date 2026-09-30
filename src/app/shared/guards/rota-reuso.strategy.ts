import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

export class RotaReusoStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(futuro: ActivatedRouteSnapshot, atual: ActivatedRouteSnapshot): boolean {
    return futuro.routeConfig === atual.routeConfig
      && JSON.stringify(futuro.params) === JSON.stringify(atual.params);
  }
}
