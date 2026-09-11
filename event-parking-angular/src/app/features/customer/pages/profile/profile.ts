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

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.customerService.getProfile(user.customerId).subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);

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

    const request: UpdateCustomerProfileRequest = {
      name: formValue.name.trim(),
      email: formValue.email.trim(),
      phone: formValue.phone.trim(),
    };

    this.customerService
      .updateProfile(user.customerId, request)
      .subscribe({
        next: (profile) => {
          this.isSaving.set(false);

          this.profileForm.patchValue({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
          });

          this.authState.setUser({
            ...user,
            name: profile.name,
            email: profile.email,
          });

          this.successMessage.set(
            'Your profile has been updated successfully.'
          );
        },

        error: (error) => {
          this.isSaving.set(false);

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
}