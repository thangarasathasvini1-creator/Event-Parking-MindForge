import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DashboardService } from '../../../../services/dashboard.service';
import { Dashboard as DashboardModel } from '../../../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly dashboard = signal<DashboardModel | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadDashboard();
  }

  setTab(tab: string): void {
    if (tab === 'events') {
      this.router.navigate(['/events']);
    } else if (tab === 'bookings') {
      this.router.navigate(['/bookings']);
    } else if (tab === 'parking') {
      this.router.navigate(['/bookings'], { queryParams: { filter: 'parking' } });
    } else if (tab === 'payments') {
      this.router.navigate(['/payments']);
    } else if (tab === 'notifications') {
      this.router.navigate(['/notifications']);
    } else if (tab === 'profile') {
      this.router.navigate(['/customer/profile']);
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getCustomerDashboard().subscribe({
      next: (response) => {
        this.dashboard.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load your dashboard. Please try again.'
        );
      },
    });
  }

  retry(): void {
    this.loadDashboard();
  }
}