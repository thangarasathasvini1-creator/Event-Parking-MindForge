import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  AuthService,
  ResetPasswordRequest,
} from '../../../../core/auth/auth';

// =========================================================
// PASSWORD MATCH VALIDATOR
// =========================================================
const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly isReset = signal(false);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly resetToken = signal('');

  // =========================================================
  // RESET PASSWORD FORM
  // =========================================================
  readonly resetPasswordForm = this.fb.nonNullable.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
        ],
      ],

      confirmPassword: [
        '',
        [
          Validators.required,
        ],
      ],
    },
    {
      validators: passwordMatchValidator,
    }
  );

  // =========================================================
  // CONSTRUCTOR
  // =========================================================
  constructor() {
    const token =
      this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.resetToken.set(token);
    } else {
      this.errorMessage.set(
        'Password reset authorization is missing or invalid. Please request a new reset code.'
      );
    }
  }

  // =========================================================
  // SUBMIT RESET PASSWORD
  // =========================================================
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.resetToken()) {
      this.errorMessage.set(
        'Your password reset session is invalid or expired. Please request a new reset code.'
      );
      return;
    }

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const formValue =
      this.resetPasswordForm.getRawValue();

    const request: ResetPasswordRequest = {
      token: this.resetToken(),
      newPassword: formValue.newPassword,
    };

    this.authService.resetPassword(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isReset.set(true);

        this.successMessage.set(
          'Your password has been reset successfully.'
        );
      },

      error: (error) => {
        this.isLoading.set(false);

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to reset your password. Please try again.'
        );
      },
    });
  }

  // =========================================================
  // TOGGLE NEW PASSWORD
  // =========================================================
  togglePassword(): void {
    this.showPassword.update(
      (value) => !value
    );
  }

  // =========================================================
  // TOGGLE CONFIRM PASSWORD
  // =========================================================
  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(
      (value) => !value
    );
  }

  // =========================================================
  // GO TO LOGIN
  // =========================================================
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}