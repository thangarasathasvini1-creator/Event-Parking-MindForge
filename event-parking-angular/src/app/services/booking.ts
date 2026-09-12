import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Booking,
  CreateBookingRequest
} from '../models/booking.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/bookings`;


  // ==================== CREATE BOOKING ====================

  createBooking(
    request: CreateBookingRequest
  ): Observable<Booking> {

    return this.http.post<Booking>(
      this.apiUrl,
      request
    );
  }


  // ==================== CUSTOMER BOOKINGS ====================

  getCustomerBookings(
    customerId: number
  ): Observable<Booking[]> {

    return this.http.get<Booking[]>(
      `${this.apiUrl}/customer/${customerId}`
    );
  }


  // ==================== GET BOOKING ====================

  getBookingById(
    bookingId: number
  ): Observable<Booking> {

    return this.http.get<Booking>(
      `${this.apiUrl}/${bookingId}`
    );
  }


  // ==================== CANCEL BOOKING ====================

  cancelBooking(
    bookingId: number,
    reason?: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${bookingId}`,
      reason ? { body: { reason } } : {}
    );
  }


  // ==================== HOLD STATUS ====================

  getHoldStatus(
    bookingId: number
  ): Observable<unknown> {

    return this.http.get<unknown>(
      `${this.apiUrl}/${bookingId}/hold-status`
    );
  }


  // ==================== PAYMENT STATUS ====================

  getPaymentStatus(
    bookingId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${bookingId}/payment`
    );
  }


  // ==================== MAKE PAYMENT ====================

  makePayment(
    bookingId: number,
    request: {
      paymentMethod: string;
    }
  ): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/${bookingId}/payment`,
      request
    );
  }

}