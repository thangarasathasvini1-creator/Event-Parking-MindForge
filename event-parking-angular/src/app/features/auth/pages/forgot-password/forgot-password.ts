import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],
  });

  // =========================
  // SUBMIT EMAIL
  // =========================
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const email =
      this.forgotPasswordForm.controls.email.value.trim();

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        this.successMessage.set(
          response?.message ??
            'A password reset OTP has been sent to your email.'
        );

        this.router.navigate(
          ['/verify-password-reset-otp'],
          {
            queryParams: {
              email,
            },
          }
        );
      },

      error: (error) => {
        this.isLoading.set(false);

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to send password reset OTP. Please try again.'
        );
      },
    });
  }

  // =========================
  // GO TO LOGIN
  // =========================
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}