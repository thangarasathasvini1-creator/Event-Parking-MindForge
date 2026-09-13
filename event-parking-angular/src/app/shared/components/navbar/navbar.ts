import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../services/notification.service';
import { AuthStateService } from '../../../core/auth/auth-state';
import { Notification } from '../../../models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {

  private readonly notificationService = inject(NotificationService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  notifications: Notification[] = [];
  isNotificationOpen = false;
  isMobileMenuOpen = false;
  isLoadingNotifications = false;

  ngOnInit(): void {
    if (this.isLoggedIn) {
      this.loadNotifications();
    }
  }

  get isLoggedIn(): boolean {
    return this.authState.isAuthenticated();
  }

  get userName(): string {
    const user = this.authState.getUser();
    return user?.name || user?.email || 'Account';
  }

  getNotificationType(type: string): string {
    return type?.trim() || 'Notification';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  loadNotifications(): void {
    const user = this.authState.getUser();

    if (!user?.customerId) {
      return;
    }

    this.isLoadingNotifications = true;

    this.notificationService
      .getCustomerNotifications(user.customerId)
      .subscribe({
        next: (notifications: Notification[]) => {
          this.notifications = notifications ?? [];
          this.isLoadingNotifications = false;
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load navbar notifications:',
            error
          );

          this.isLoadingNotifications = false;
        },
      });
  }

  get unreadCount(): number {
    return this.notifications.filter(
      notification => !notification.isRead
    ).length;
  }

  toggleNotifications(): void {
    this.isNotificationOpen =
      !this.isNotificationOpen;

    if (this.isNotificationOpen) {
      this.loadNotifications();
    }
  }

  openNotifications(): void {
    this.isNotificationOpen = false;
    this.closeMobileMenu();
    this.router.navigate(['/notifications']);
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService
      .markAsRead(notification.notificationId)
      .subscribe({
        next: () => {
          notification.isRead = true;
          notification.readAt =
            new Date().toISOString();
        },

        error: (error: unknown) => {
          console.error(
            'Failed to mark notification as read:',
            error
          );
        },
      });
  }

  goToNotification(notification: Notification): void {
    this.markAsRead(notification);
    this.openNotifications();
  }

  goToHome(): void {
    this.closeMobileMenu();
    if (this.isLoggedIn) {
      this.router.navigate(['/customer/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  goToEvents(): void {
    this.closeMobileMenu();
    this.router.navigate(['/events']);
  }

  goToBookings(): void {
    this.closeMobileMenu();
    this.router.navigate(['/bookings']);
  }

  goToPayments(): void {
    this.closeMobileMenu();
    this.router.navigate(['/payments']);
  }

  goToProfile(): void {
    this.closeMobileMenu();
    this.router.navigate(['/customer/profile']);
  }

  goToLogin(): void {
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.closeMobileMenu();
    this.authState.clearUser();
    this.router.navigate(['/login']);
  }
}