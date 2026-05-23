import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppFacade } from '../../shared/facade';
import { NavigationService } from '../../shared/services/navigation/navigation.service';
import { ApiService } from '../../shared/services/api/api.service';
import { AuthService } from '../../shared/services/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
})
export class LoginComponent implements OnInit {
  private facade = inject(AppFacade);
  private navigationService = inject(NavigationService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  credentials = {
    email: '',
    password: '',
  };

  isLoggingIn = false;
  errorMessage = '';

  login(){
    console.log('Attempting login with credentials:', this.credentials);
    this.isLoggingIn = true;
    this.apiService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoggingIn = false;
        this.authService.setToken(response.token);
        this.navigationService.navigateTo('home');
      },
      error: (error) => {
        console.log('Login error:', error);
        this.isLoggingIn = false;
        this.errorMessage = error.error?.message || 'An error occurred during login.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
    this.facade.setLoading(false);
    }, 100);
  }

  navigateToWelcome(){
    this.navigationService.navigateTo('welcome');
  }
}
