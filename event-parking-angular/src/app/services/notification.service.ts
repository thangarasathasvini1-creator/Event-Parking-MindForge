import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Notification } from '../models/notification.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/notifications`;

  // ============================================================
  // GET CUSTOMER NOTIFICATIONS
  // ============================================================

  getCustomerNotifications(
    customerId: number
  ): Observable<Notification[]> {
    return this.http.get<Notification[]>(
      `${this.apiUrl}/customer/${customerId}`
    );
  }

  // ============================================================
  // MARK NOTIFICATION AS READ
  // ============================================================

  markAsRead(
    notificationId: number
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${notificationId}/read`,
      {}
    );
  }
}