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
  isLoadingNotifications = false;

  ngOnInit(): void {
    this.loadNotifications();
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
    this.router.navigate(['/customer/dashboard']);
  }

  goToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  logout(): void {
    this.authState.clearUser();
    this.router.navigate(['/login']);
  }
}