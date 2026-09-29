import { Component, inject, OnInit } from '@angular/core';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
  standalone: true,
})
export class WelcomeComponent implements OnInit {
  private facade = inject(AppFacade);
  private navigationService = inject(NavigationService);

  ngOnInit(): void {
    setTimeout(() => {
    this.facade.setLoading(false);
    }, 100);
  }

  navigateToLogin(){
    this.navigationService.navigateTo('login');
  }

  navigateToRegistrar(){
    this.navigationService.navigateTo('registrar');
  }
}
