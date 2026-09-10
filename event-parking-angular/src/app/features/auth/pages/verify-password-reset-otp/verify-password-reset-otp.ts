import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import {
  AuthService,
  VerifyPasswordResetOtpRequest,
} from '../../../../core/auth/auth';

@Component({
  selector: 'app-verify-password-reset-otp',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-password-reset-otp.html',
  styleUrl: './verify-password-reset-otp.css',
})
export class VerifyPasswordResetOtp {
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
  // VERIFY PASSWORD RESET OTP
  // =========================
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email()) {
      this.errorMessage.set(
        'Email address is missing. Please request a new password reset code.'
      );
      return;
    }

    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const request: VerifyPasswordResetOtpRequest = {
      email: this.email(),
      otp: this.otpForm.controls.otp.value,
    };

    this.authService
      .verifyPasswordResetOtp(request)
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          if (!response?.resetToken) {
            this.errorMessage.set(
              'Password reset authorization could not be created. Please try again.'
            );
            return;
          }

          this.isVerified.set(true);
          this.successMessage.set(
            'OTP verified successfully. You can now create a new password.'
          );

          this.router.navigate(
            ['/reset-password'],
            {
              queryParams: {
                token: response.resetToken,
              },
            }
          );
        },

        error: (error) => {
          this.isLoading.set(false);

          this.errorMessage.set(
            error?.error?.message ??
              'Invalid, expired, or maximum-attempts-exceeded OTP.'
          );
        },
      });
  }

  // =========================
  // RESEND PASSWORD RESET OTP
  // =========================
  resendOtp(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email()) {
      this.errorMessage.set(
        'Email address is missing. Please request a new password reset code.'
      );
      return;
    }

    this.isResending.set(true);

    this.authService
      .forgotPassword(this.email())
      .subscribe({
        next: (response) => {
          this.isResending.set(false);

          this.successMessage.set(
            response?.message ??
              'A new password reset OTP has been sent to your email.'
          );

          this.otpForm.reset();
        },

        error: (error) => {
          this.isResending.set(false);

          this.errorMessage.set(
            error?.error?.message ??
              'Unable to resend password reset OTP. Please try again.'
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
  // OTP KEYBOARD VALIDATION
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

  // =========================
  // OTP PASTE VALIDATION
  // =========================
  preventPasteNonNumeric(
    event: ClipboardEvent
  ): void {
    const pastedText =
      event.clipboardData?.getData('text') ?? '';

    if (!/^[0-9]*$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}