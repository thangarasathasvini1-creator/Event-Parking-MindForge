import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Notification } from '../../../../models/notification.model';
import { NotificationService } from '../../../../services/notification.service';
import { AuthStateService } from '../../../../core/auth/auth-state';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly authState = inject(AuthStateService);

  notifications: Notification[] = [];

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadNotifications();
  }

  // ============================================================
  // LOAD CUSTOMER NOTIFICATIONS
  // ============================================================

  loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const user = this.authState.getUser();

    if (!user?.customerId) {
      this.isLoading = false;
      this.errorMessage =
        'Unable to identify the logged-in customer. Please log in again.';
      return;
    }

    this.notificationService
      .getCustomerNotifications(user.customerId)
      .subscribe({
        next: (notifications: Notification[]) => {
          this.notifications = notifications ?? [];
          this.isLoading = false;
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load notifications:',
            error
          );

          this.isLoading = false;
          this.handleError(error);
        },
      });
  }

  // ============================================================
  // MARK SINGLE NOTIFICATION AS READ
  // ============================================================

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService
      .markAsRead(notification.notificationId)
      .subscribe({
        next: () => {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
        },

        error: (error: unknown) => {
          console.error(
            'Failed to mark notification as read:',
            error
          );
        },
      });
  }

  // ============================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ============================================================

  markAllAsRead(): void {
    const unreadNotifications =
      this.notifications.filter(
        (notification) => !notification.isRead
      );

    if (unreadNotifications.length === 0) {
      return;
    }

    unreadNotifications.forEach(
      (notification) => {
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
                `Failed to mark notification ${notification.notificationId} as read:`,
                error
              );
            },
          });
      }
    );
  }

  // ============================================================
  // REFRESH
  // ============================================================

  refresh(): void {
    this.loadNotifications();
  }

  // ============================================================
  // UNREAD COUNT
  // ============================================================

  get unreadCount(): number {
    return this.notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }

  // ============================================================
  // NOTIFICATION TYPE
  // ============================================================

  getNotificationType(
    type: string
  ): string {
    return type?.trim() || 'Notification';
  }

  // ============================================================
  // TYPE STYLE
  // ============================================================

  getTypeClass(type: string): string {
    const normalizedType =
      (type ?? '').trim().toLowerCase();

    switch (normalizedType) {
      case 'booking':
      case 'bookingconfirmed':
      case 'booking_confirmed':
        return 'bg-blue-100 text-blue-700';

      case 'payment':
      case 'paymentcompleted':
      case 'payment_completed':
        return 'bg-emerald-100 text-emerald-700';

      case 'cancellation':
      case 'bookingcancelled':
      case 'booking_cancelled':
        return 'bg-rose-100 text-rose-700';

      case 'event':
      case 'eventupdated':
      case 'event_updated':
        return 'bg-violet-100 text-violet-700';

      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  // ============================================================
  // DATE FORMAT
  // ============================================================

  getNotificationDate(
    createdAt: string
  ): Date | null {
    if (!createdAt) {
      return null;
    }

    const date = new Date(createdAt);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  private handleError(error: unknown): void {
    const httpError = error as {
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
        'You do not have permission to view notifications.';
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage =
        'Notifications were not found.';
      return;
    }

    if (
      httpError.status !== undefined &&
      httpError.status >= 500
    ) {
      this.errorMessage =
        'The notification service is temporarily unavailable. Please try again later.';
      return;
    }

    this.errorMessage =
      httpError.error?.message ??
      'Unable to load notifications. Please try again.';
  }
}