import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  AuthService,
  RegisterRequest,
} from '../../../../core/auth/auth';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly errorMessage = signal('');

  readonly registerForm = this.fb.nonNullable.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
        ],
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ],
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9+\-\s()]{7,20}$/
          ),
        ],
      ],

      password: [
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

  // =========================
  // SUBMIT REGISTRATION
  // =========================
  onSubmit(): void {
    this.errorMessage.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const formValue = this.registerForm.getRawValue();

    const request: RegisterRequest = {
      name: formValue.name.trim(),
      email: formValue.email.trim(),
      phone: formValue.phone.trim(),
      password: formValue.password,
    };

    this.authService.register(request).subscribe({
      // =========================
      // REGISTRATION SUCCESS
      // =========================
      next: () => {
        this.isLoading.set(false);

        this.router.navigate(['/verify-email'], {
          queryParams: {
            email: formValue.email.trim(),
          },
        });
      },

      // =========================
      // REGISTRATION ERROR
      // =========================
      error: (error) => {
        this.isLoading.set(false);

        if (error?.status === 409) {
          this.errorMessage.set(
            'An account with this email already exists.'
          );
          return;
        }

        this.errorMessage.set(
          error?.error?.message ??
            'Registration failed. Please try again.'
        );
      },
    });
  }

  // =========================
  // TOGGLE PASSWORD
  // =========================
  togglePassword(): void {
    this.showPassword.update(
      (value) => !value
    );
  }

  // =========================
  // TOGGLE CONFIRM PASSWORD
  // =========================
  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(
      (value) => !value
    );
  }

  // =========================
  // GO TO LOGIN
  // =========================
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}