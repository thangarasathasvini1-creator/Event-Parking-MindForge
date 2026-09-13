import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  CustomerService,
  UpdateCustomerProfileRequest,
} from '../../../../services/customer.service';
import { AuthStateService } from '../../../../core/auth/auth-state';
import { AuthStorageService } from '../../../../core/auth/auth-storage';
import { AuthService } from '../../../../core/auth/auth';
import { DashboardService } from '../../../../services/dashboard.service';
import { Dashboard as DashboardModel } from '../../../../models/dashboard.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly authState = inject(AuthStateService);
  private readonly authStorage = inject(AuthStorageService);
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly sidebarCollapsed = signal(false);
  readonly showProfile = signal(true);
  readonly dashboard = signal<DashboardModel | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9+\-\s()]{7,20}$/),
      ],
    ],
  });

  ngOnInit(): void {
    // Immediately prefill email from auth state or token so the text box is never empty
    const initialEmail = this.resolveEmail();
    const currentUser = this.authState.user();
    if (initialEmail) {
      this.profileForm.patchValue({
        email: initialEmail,
        name: currentUser?.name ?? '',
      });
    }

    this.loadProfile();
    this.loadDashboard();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  openProfile(): void {
    this.showProfile.set(true);
  }

  closeProfile(): void {
    this.showProfile.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resolveEmail(): string {
    const fromAuth = this.authState.user()?.email?.trim();
    if (fromAuth) return fromAuth;

    const fromForm = this.profileForm.controls.email.value?.trim();
    if (fromForm) return fromForm;

    return this.getEmailFromToken();
  }

  private getEmailFromToken(): string {
    const token = this.authStorage.getToken();
    if (!token) return '';
    try {
      const parts = token.split('.');
      if (parts.length < 2) return '';
      const payload = JSON.parse(atob(parts[1]));
      return (
        payload.email ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        payload.sub ||
        ''
      );
    } catch {
      return '';
    }
  }

  private loadDashboard(): void {
    this.dashboardService.getCustomerDashboard().subscribe({
      next: (data) => this.dashboard.set(data),
      error: () => {},
    });
  }

  private loadProfile(): void {
    const user = this.authState.user();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const fallbackEmail = this.resolveEmail();

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.customerService.getProfile(user.customerId).subscribe({
      next: (profile) => {
        const resolvedEmail = profile.email?.trim() || fallbackEmail;

        this.profileForm.patchValue({
          name: profile.name || user.name || '',
          email: resolvedEmail,
          phone: profile.phone || '',
        });

        if (resolvedEmail) {
          this.authState.setUser({
            ...user,
            name: profile.name || user.name,
            email: resolvedEmail,
          });
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Ensure email remains in the text box even if network error occurs
        if (fallbackEmail) {
          this.profileForm.patchValue({
            email: fallbackEmail,
          });
        }

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load your profile. Please try again.'
        );
      },
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.authState.user();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isSaving.set(true);

    const formValue = this.profileForm.getRawValue();
    const emailToKeep = this.resolveEmail();

    const request: UpdateCustomerProfileRequest = {
      name: formValue.name.trim(),
      email: emailToKeep,
      phone: formValue.phone.trim(),
    };

    this.customerService
      .updateProfile(user.customerId, request)
      .subscribe({
        next: (response: any) => {
          this.isSaving.set(false);

          // Backend returns { message: "Customer updated successfully." }, NOT the full CustomerProfile
          // If response.name / response.email are undefined, do NOT overwrite with undefined!
          const finalName = response?.name || request.name;
          const finalEmail = response?.email || emailToKeep;
          const finalPhone = response?.phone || request.phone;

          this.profileForm.patchValue({
            name: finalName,
            email: finalEmail,
            phone: finalPhone,
          });

          this.authState.setUser({
            ...user,
            name: finalName,
            email: finalEmail,
          });

          this.successMessage.set(
            'Your profile has been updated successfully.'
          );
        },

        error: (error) => {
          this.isSaving.set(false);

          // Always ensure email remains populated even if save failed
          this.profileForm.patchValue({
            email: emailToKeep,
          });

          this.errorMessage.set(
            error?.error?.message ??
              'Unable to update your profile. Please try again.'
          );
        },
      });
  }

  goToDashboard(): void {
    this.router.navigate(['/customer/dashboard']);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }
}