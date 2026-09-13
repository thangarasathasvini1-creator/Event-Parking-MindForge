import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Payment } from '../models/payment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  getAdminPayments(search = '', status = ''): Observable<AdminPayment[]> {
    return this.http.get<AdminPayment[]>(this.apiUrl, { params: { search, status } });
  }

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/payments`;


  // ==================== CUSTOMER PAYMENT HISTORY ====================

  getCustomerPaymentHistory(
    customerId: number
  ): Observable<Payment[]> {

    return this.http.get<Payment[]>(
      `${this.apiUrl}/customer/${customerId}`
    );
  }


  // ==================== PAYMENT DETAILS / RECEIPT DATA ====================

  getPaymentById(
    paymentId: number
  ): Observable<Payment> {

    return this.http.get<Payment>(
      `${this.apiUrl}/${paymentId}/receipt`
    );
  }

  getPaymentReceipt(
    paymentId: number
  ): Observable<Payment> {

    return this.http.get<Payment>(
      `${this.apiUrl}/${paymentId}/receipt`
    );
  }


  // ==================== PAYMENT RECEIPT ====================

  getReceipt(
    paymentId: number
  ): Observable<Blob> {

    return this.http.get(
      `${this.apiUrl}/${paymentId}/receipt`,
      {
        responseType: 'blob'
      }
    );
  }

}
export interface AdminPayment { paymentId: number; bookingId: number; bookingNumber: string; customerId: number; customerName: string; eventName: string; amount: number; status: string; transactionReference: string | null; paidAt: string | null; }
