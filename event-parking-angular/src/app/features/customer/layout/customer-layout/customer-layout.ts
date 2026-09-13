import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth';
import { AuthStateService } from '../../../../core/auth/auth-state';
import { DashboardService } from '../../../../services/dashboard.service';
import { Dashboard as DashboardModel } from '../../../../models/dashboard.model';

export type CustomerNavTab =
  | 'dashboard'
  | 'events'
  | 'profile'
  | 'bookings'
  | 'parking'
  | 'payments'
  | 'notifications';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './customer-layout.html',
  styleUrl: './customer-layout.css',
})
export class CustomerLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly dashboardService = inject(DashboardService);

  readonly dashboard = signal<DashboardModel | null>(null);
  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);
  readonly topSearchQuery = signal('');

  readonly userName = computed(() => {
    const u = this.authState.getUser();
    return u?.name || u?.email?.split('@')[0] || 'Customer';
  });

  readonly userEmail = computed(() => {
    const u = this.authState.getUser();
    return u?.email || '';
  });

  readonly userInitial = computed(() => {
    const name = this.userName();
    return name.charAt(0).toUpperCase();
  });

  readonly activeTab = computed<CustomerNavTab>(() => {
    const url = this.currentUrl();
    if (url.includes('/customer/profile')) return 'profile';
    if (url.includes('/customer/parking') || url.includes('/bookings')) return 'bookings';
    if (url.includes('/payments')) return 'payments';
    if (url.includes('/notifications')) return 'notifications';
    if (url.includes('/events')) return 'events';
    return 'dashboard';
  });

  ngOnInit(): void {
    const user = this.authState.getUser();
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'administrator') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.mobileMenuOpen.set(false);
        this.profileMenuOpen.set(false);
      });

    this.loadStats();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((v) => !v);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  navigateTab(tab: CustomerNavTab): void {
    this.mobileMenuOpen.set(false);
    this.profileMenuOpen.set(false);
    switch (tab) {
      case 'dashboard':
        this.router.navigate(['/customer/dashboard']);
        break;
      case 'events':
        this.router.navigate(['/events']);
        break;
      case 'bookings':
        this.router.navigate(['/bookings']);
        break;
      case 'parking':
        this.router.navigate(['/bookings'], { queryParams: { filter: 'parking' } });
        break;
      case 'payments':
        this.router.navigate(['/payments']);
        break;
      case 'notifications':
        this.router.navigate(['/notifications']);
        break;
      case 'profile':
        this.router.navigate(['/customer/profile']);
        break;
    }
  }

  onTopSearch(): void {
    const q = this.topSearchQuery().trim();
    if (q) {
      this.router.navigate(['/events'], { queryParams: { name: q } });
    } else {
      this.router.navigate(['/events']);
    }
  }

  logout(): void {
    this.mobileMenuOpen.set(false);
    this.profileMenuOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadStats(): void {
    this.dashboardService.getCustomerDashboard().subscribe({
      next: (resp) => this.dashboard.set(resp),
      error: () => {},
    });
  }
}
