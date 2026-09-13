import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Seat, CreateSeatDto, UpdateSeatDto } from '../models/seat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  generateMap(eventId: number, count: number, columns: number, vipSeatsCount: number = 0): Observable<Seat[]> {
    return this.http.post<Seat[]>(`${environment.apiUrl}/events/${eventId}/seats/generate`, { count, columns, vipSeatsCount });
  }

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/events`;

  getSeatsByEvent(eventId: number): Observable<Seat[]> {
    return this.http.get<Seat[]>(
      `${this.apiUrl}/${eventId}/seats`
    );
  }

  getSeat(eventId: number, seatId: number): Observable<Seat> {
    return this.http.get<Seat>(
      `${this.apiUrl}/${eventId}/seats/${seatId}`
    );
  }

  createSeat(eventId: number, dto: CreateSeatDto): Observable<Seat> {
    return this.http.post<Seat>(
      `${this.apiUrl}/${eventId}/seats`,
      dto
    );
  }

  updateSeat(eventId: number, seatId: number, dto: UpdateSeatDto): Observable<Seat> {
    return this.http.put<Seat>(
      `${this.apiUrl}/${eventId}/seats/${seatId}`,
      dto
    );
  }

  deleteSeat(eventId: number, seatId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${eventId}/seats/${seatId}`
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
