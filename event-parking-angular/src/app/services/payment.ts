import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Payment } from '../models/payment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

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


  // ==================== PAYMENT DETAILS ====================

  getPaymentById(
    paymentId: number
  ): Observable<Payment> {

    return this.http.get<Payment>(
      `${this.apiUrl}/${paymentId}`
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