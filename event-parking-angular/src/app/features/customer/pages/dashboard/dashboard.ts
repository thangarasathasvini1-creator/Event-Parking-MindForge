import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DashboardService } from '../../../../services/dashboard.service';
import { Dashboard as DashboardModel } from '../../../../models/dashboard.model';
import { AuthService } from '../../../../core/auth/auth';
import { EventList } from '../events/event-list/event-list';
import { Profile } from '../profile/profile';

export type CustomerDashboardTab =
  | 'dashboard'
  | 'events'
  | 'profile'
  | 'bookings'
  | 'parking'
  | 'payments'
  | 'notifications';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [EventList, Profile],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly dashboard = signal<DashboardModel | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly sidebarCollapsed = signal(false);
  readonly activeTab = signal<CustomerDashboardTab>('dashboard');

  ngOnInit(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/events')) {
      this.activeTab.set('events');
    } else if (currentUrl.includes('/customer/profile')) {
      this.activeTab.set('profile');
    }

    this.route.queryParams.subscribe((params) => {
      const tabParam = params['tab'] as CustomerDashboardTab;
      if (
        tabParam &&
        [
          'dashboard',
          'events',
          'profile',
          'bookings',
          'parking',
          'payments',
          'notifications',
        ].includes(tabParam)
      ) {
        this.activeTab.set(tabParam);
      }
    });

    this.loadDashboard();
  }

  setTab(tab: CustomerDashboardTab): void {
    this.activeTab.set(tab);
    if (tab === 'events') {
      this.router.navigate(['/events']);
    } else if (tab === 'profile') {
      this.router.navigate(['/customer/profile']);
    } else if (tab === 'bookings') {
      this.router.navigate(['/bookings']);
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}