import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth';
import { AuthStateService } from '../../../../core/auth/auth-state';

export type AdminNavTab =
  | 'customers'
  | 'dashboard'
  | 'events'
  | 'bookings'
  | 'payments'
  | 'venues'
  | 'categories'
  | 'seats'
  | 'parking';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);

  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);

  readonly userName = computed(() => {
    const u = this.authState.getUser();
    return u?.name || u?.email?.split('@')[0] || 'Administrator';
  });

  readonly userEmail = computed(() => {
    const u = this.authState.getUser();
    return u?.email || '';
  });

  readonly userInitial = computed(() => {
    const name = this.userName();
    return name.charAt(0).toUpperCase();
  });

  readonly activeTab = computed<AdminNavTab>(() => {
    const url = this.currentUrl();
    if (url.includes('/admin/customers')) return 'customers';
    if (url.includes('/admin/events')) return 'events';
    if (url.includes('/admin/bookings')) return 'bookings';
    if (url.includes('/admin/payments')) return 'payments';
    if (url.includes('/admin/venues')) return 'venues';
    if (url.includes('/admin/categories')) return 'categories';
    if (url.includes('/admin/seats')) return 'seats';
    if (url.includes('/admin/parking')) return 'parking';
    return 'dashboard';
  });

  readonly pageTitle = computed(() => {
    switch (this.activeTab()) {
      case 'customers': return 'Customer Management';
      case 'events':
        return 'Events Management';
      case 'bookings':
        return 'Bookings & Reservations';
      case 'payments':
        return 'Payments & Revenue';
      case 'venues':
        return 'Venues & Availability';
      case 'categories':
        return 'Event Categories';
      case 'seats':
        return 'Seat Allocation';
      case 'parking':
        return 'Parking Management';
      default:
        return 'Executive Dashboard';
    }
  });

  ngOnInit(): void {
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.mobileMenuOpen.set(false);
        this.profileMenuOpen.set(false);
      });
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

  navigateTab(tab: AdminNavTab): void {
    this.mobileMenuOpen.set(false);
    this.profileMenuOpen.set(false);
    switch (tab) {
      case 'customers': this.router.navigate(['/admin/customers']); break;
      case 'dashboard':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'events':
        this.router.navigate(['/admin/events']);
        break;
      case 'bookings':
        this.router.navigate(['/admin/bookings']);
        break;
      case 'payments':
        this.router.navigate(['/admin/payments']);
        break;
      case 'venues':
        this.router.navigate(['/admin/venues']);
        break;
      case 'categories':
        this.router.navigate(['/admin/categories']);
        break;
      case 'seats':
        this.router.navigate(['/admin/seats']);
        break;
      case 'parking':
        this.router.navigate(['/admin/parking']);
        break;
    }
  }

  goToCustomerPortal(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.mobileMenuOpen.set(false);
    this.profileMenuOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
