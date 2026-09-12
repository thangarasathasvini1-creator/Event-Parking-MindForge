import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  private readonly dashboardService =
    inject(DashboardService);

  dashboardData: unknown = null;

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  // ==================== LOAD ADMIN DASHBOARD ====================

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService
      .getAdminDashboard()
      .subscribe({
        next: (response: unknown) => {
          this.dashboardData = response;
          this.isLoading = false;

          console.log(
            'Admin dashboard data:',
            response
          );
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load admin dashboard:',
            error
          );

          this.isLoading = false;
          this.handleError(error);
        },
      });
  }

  // ==================== RETRY ====================

  retry(): void {
    this.loadDashboard();
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: unknown): void {

    const httpError =
      error as {
        status?: number;
        error?: {
          message?: string;
        };
      };

    if (httpError.status === 401) {
      this.errorMessage =
        'Your session has expired. Please log in again.';
      return;
    }

    if (httpError.status === 403) {
      this.errorMessage =
        'You do not have permission to access the admin dashboard.';
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage =
        'Admin dashboard data was not found.';
      return;
    }

    if (
      httpError.status !== undefined &&
      httpError.status >= 500
    ) {
      this.errorMessage =
        'The server is temporarily unavailable. Please try again later.';
      return;
    }

    this.errorMessage =
      httpError.error?.message ??
      'Unable to load the admin dashboard. Please try again.';
  }
}