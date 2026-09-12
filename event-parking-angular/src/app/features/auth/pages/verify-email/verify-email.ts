import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  AuthService,
  VerifyEmailOtpRequest,
} from '../../../../core/auth/auth';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly isResending = signal(false);
  readonly isVerified = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly email = signal('');

  readonly otpForm = this.fb.nonNullable.group({
    otp: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/),
      ],
    ],
  });

  constructor() {
    const emailFromRoute =
      this.route.snapshot.queryParamMap.get('email');

    if (emailFromRoute) {
      this.email.set(emailFromRoute);
    }
  }

  // =========================
  // VERIFY OTP
  // =========================
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email()) {
      this.errorMessage.set(
        'Email address is missing. Please register again.'
      );
      return;
    }

    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const request: VerifyEmailOtpRequest = {
      email: this.email(),
      otp: this.otpForm.controls.otp.value,
    };

    this.authService.verifyEmailOtp(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.isVerified.set(true);
        this.successMessage.set(
          response?.message ??
          'Email verified successfully.'
        );
      },

      error: (error) => {
        this.isLoading.set(false);

        this.errorMessage.set(
          error?.error?.message ??
          'Invalid or expired OTP. Please try again.'
        );
      },
    });
  }

  // =========================
  // RESEND OTP
  // =========================
  resendOtp(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email()) {
      this.errorMessage.set(
        'Email address is missing. Please register again.'
      );
      return;
    }

    this.isResending.set(true);

    this.authService
      .resendVerification(this.email())
      .subscribe({
        next: (response) => {
          this.isResending.set(false);

          this.successMessage.set(
            response?.message ??
            'A new verification OTP has been sent to your email.'
          );
        },

        error: (error) => {
          this.isResending.set(false);

          this.errorMessage.set(
            error?.error?.message ??
            'Unable to resend OTP. Please try again.'
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

  // =========================
  // OTP INPUT HELPERS
  // =========================
  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];

    if (
      allowedKeys.includes(event.key) ||
      /^[0-9]$/.test(event.key)
    ) {
      return;
    }

    event.preventDefault();
  }

  preventPasteNonNumeric(event: ClipboardEvent): void {
    const pastedText =
      event.clipboardData?.getData('text') ?? '';

    if (!/^[0-9]*$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}