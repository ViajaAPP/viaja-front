import { Component, inject, OnInit } from '@angular/core';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
})
export class LoginComponent implements OnInit {
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

  navigateToHome(){
    this.navigationService.navigateTo('home');
  }
}
