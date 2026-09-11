import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { DashboardService } from '../../../../services/dashboard.service';
import { Dashboard as DashboardModel } from '../../../../models/dashboard.model';
import { AuthService } from '../../../../core/auth/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly dashboard = signal<DashboardModel | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly sidebarCollapsed = signal(false);

  readonly showProfile = signal(false);

  ngOnInit(): void {
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