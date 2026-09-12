import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Seat } from '../models/seat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SeatService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/events`;

  getSeatsByEvent(eventId: number): Observable<Seat[]> {
    return this.http.get<Seat[]>(
      `${this.apiUrl}/${eventId}/seats`
    );
  }

  assignSeats(
    bookingId: number,
    seatIds: number[]
  ): Observable<unknown> {
    return this.http.post(
      `${environment.apiUrl}/bookings/${bookingId}/seats`,
      {
        seatIds
      }
    );
  }
}