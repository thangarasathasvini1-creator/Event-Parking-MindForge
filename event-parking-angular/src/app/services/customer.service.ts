import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface CustomerProfile {
  totalBookings?: number;
  upcomingBookings?: number;
  customerId: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateCustomerProfileRequest {
  name: string;
  email: string;
  phone: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/customers`;

  searchCustomers(search = ''): Observable<CustomerProfile[]> {
    return this.http.get<CustomerProfile[]>(this.apiUrl, { params: { search } });
  }
  deactivate(id: number): Observable<unknown> { return this.http.delete(`${this.apiUrl}/${id}`); }
  reactivate(id: number): Observable<unknown> { return this.http.post(`${this.apiUrl}/${id}/reactivate`, {}); }
  getProfile(customerId: number): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(
      `${this.apiUrl}/${customerId}`
    );
  }

  updateProfile(
    customerId: number,
    request: UpdateCustomerProfileRequest
  ): Observable<CustomerProfile> {
    return this.http.put<CustomerProfile>(
      `${this.apiUrl}/${customerId}`,
      request
    );
  }
}