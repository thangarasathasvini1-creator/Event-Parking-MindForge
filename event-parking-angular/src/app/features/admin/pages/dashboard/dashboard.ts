import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AdminDashboard } from '../../../../models/dashboard.model';
import { DashboardService } from '../../../../services/dashboard.service';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCard,
    LoadingSpinner,
    EmptyState,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly dashboardData = signal<AdminDashboard | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadDashboard();
  }

  // ==================== LOAD ADMIN DASHBOARD ====================

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getAdminDashboard().subscribe({
      next: (response: AdminDashboard) => {
        this.dashboardData.set(response);
        this.isLoading.set(false);
      },

      error: (error: unknown) => {
        console.error('Failed to load admin dashboard:', error);
        this.isLoading.set(false);
        this.handleError(error);
      },
    });
  }

  // ==================== NAVIGATION ====================

  goToBookings(): void {
    this.router.navigate(['/admin/bookings']);
  }

  goToEvents(): void {
    this.router.navigate(['/admin/events']);
  }

  goToParking(): void {
    this.router.navigate(['/admin/parking']);
  }

  goToSeats(): void {
    this.router.navigate(['/admin/seats']);
  }

  // ==================== RETRY ====================

  retry(): void {
    this.loadDashboard();
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: unknown): void {
    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };

    if (httpError.status === 401) {
      this.errorMessage.set('Your session has expired. Please log in again.');
      return;
    }

    if (httpError.status === 403) {
      this.errorMessage.set('You do not have permission to access the admin dashboard.');
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage.set('Admin dashboard data was not found.');
      return;
    }

    if (httpError.status !== undefined && httpError.status >= 500) {
      this.errorMessage.set('The server is temporarily unavailable. Please try again later.');
      return;
    }

    this.errorMessage.set(httpError.error?.message ?? 'Unable to load the admin dashboard. Please try again.');
  }
}