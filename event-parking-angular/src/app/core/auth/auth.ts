import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { AuthStateService } from './auth-state';
import { AuthStorageService } from './auth-storage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  customerId: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailOtpResponse {
  message: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyPasswordResetOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyPasswordResetOtpResponse {
  resetToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}



@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private readonly authStorage = inject(AuthStorageService);

  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  // =========================
  // LOGIN
  // =========================
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap((response) => {
          this.authStorage.setToken(response.token);

          this.authState.setUser({
            customerId: response.customerId,
            name: response.name,
            email: response.email,
            role: response.role,
          });
        })
      );
  }

  // =========================
  // REGISTER
  // =========================
  register(request: RegisterRequest): Observable<unknown> {
    return this.http.post<unknown>(
      `${environment.apiUrl}/api/customers/register`,
      request
    );
  }

  // =========================
  // VERIFY EMAIL OTP
  // =========================
  verifyEmailOtp(
    request: VerifyEmailOtpRequest
  ): Observable<VerifyEmailOtpResponse> {
    return this.http.post<VerifyEmailOtpResponse>(
      `${this.apiUrl}/verify-email-otp`,
      request
    );
  }

  // =========================
  // RESEND VERIFICATION OTP
  // =========================
  resendVerification(
    email: string
  ): Observable<ResendVerificationResponse> {
    return this.http.post<ResendVerificationResponse>(
      `${this.apiUrl}/resend-verification`,
      email
    );
  }

  // =========================
// FORGOT PASSWORD
// =========================
// =========================
// FORGOT PASSWORD
// =========================
forgotPassword(
  email: string
): Observable<ForgotPasswordResponse> {
  return this.http.post<ForgotPasswordResponse>(
    `${this.apiUrl}/forgot-password`,
    JSON.stringify(email),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// =========================
// VERIFY PASSWORD RESET OTP
// =========================
verifyPasswordResetOtp(
    request: VerifyPasswordResetOtpRequest
    ): Observable<VerifyPasswordResetOtpResponse> {
    return this.http.post<VerifyPasswordResetOtpResponse>(
        `${this.apiUrl}/verify-password-reset-otp`,
        request
    );
}

// =========================
// RESET PASSWORD
// =========================
resetPassword(
  request: ResetPasswordRequest
): Observable<unknown> {
  return this.http.post<unknown>(
    `${this.apiUrl}/reset-password`,
    request
  );
}

  // =========================
  // LOGOUT
  // =========================
  logout(): void {
    this.authStorage.clear();
    this.authState.clearUser();
  }

  // =========================
  // AUTH STATUS
  // =========================
  isLoggedIn(): boolean {
    return this.authStorage.hasToken();
  }

  // =========================
  // GET TOKEN
  // =========================
  getToken(): string | null {
    return this.authStorage.getToken();
  }
}