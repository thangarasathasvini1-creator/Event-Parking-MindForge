import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ParkingSlot } from '../models/parking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParkingService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/events`;

  getParkingSlotsByEvent(eventId: number): Observable<ParkingSlot[]> {
    return this.http.get<ParkingSlot[]>(
      `${this.apiUrl}/${eventId}/parking-slots`
    );
  }

  assignParking(
    bookingId: number,
    parkingSlotId: number
  ): Observable<unknown> {
    return this.http.post(
      `${environment.apiUrl}/bookings/${bookingId}/parking`,
      {
        parkingSlotId
      }
    );
  }

  removeParking(bookingId: number): Observable<unknown> {
    return this.http.delete(
      `${environment.apiUrl}/bookings/${bookingId}/parking`
    );
  }
}