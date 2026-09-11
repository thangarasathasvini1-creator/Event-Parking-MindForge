import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth';
import { environment } from '../../../../../environments/environment.development';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (response.role.toLowerCase() === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/customer/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Invalid email or password.'
        );
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  goToGoogleLogin(): void {
  window.location.href = `${environment.apiUrl}/api/auth/google`;
}
}