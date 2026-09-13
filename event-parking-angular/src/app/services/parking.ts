import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ParkingSlot, CreateParkingSlotDto, UpdateParkingSlotDto } from '../models/parking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParkingService {
  generateLayout(eventId: number, count: number, zone: string, vehicleType: string, fee: number): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/events/${eventId}/parking-slots/generate`, { count, zone, vehicleType, fee });
  }

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/events`;

  getParkingSlotsByEvent(eventId: number): Observable<ParkingSlot[]> {
    return this.http.get<ParkingSlot[]>(
      `${this.apiUrl}/${eventId}/parking-slots`
    );
  }

  getAvailableParkingSlots(eventId: number, vehicleType: string): Observable<ParkingSlot[]> {
    return this.http.get<ParkingSlot[]>(
      `${this.apiUrl}/${eventId}/parking-slots/available`,
      { params: { vehicleType } }
    );
  }

  getParkingSlot(eventId: number, slotId: number): Observable<ParkingSlot> {
    return this.http.get<ParkingSlot>(
      `${this.apiUrl}/${eventId}/parking-slots/${slotId}`
    );
  }

  createParkingSlot(eventId: number, dto: CreateParkingSlotDto): Observable<ParkingSlot> {
    return this.http.post<ParkingSlot>(
      `${this.apiUrl}/${eventId}/parking-slots`,
      dto
    );
  }

  updateParkingSlot(eventId: number, slotId: number, dto: UpdateParkingSlotDto): Observable<ParkingSlot> {
    return this.http.put<ParkingSlot>(
      `${this.apiUrl}/${eventId}/parking-slots/${slotId}`,
      dto
    );
  }

  deleteParkingSlot(eventId: number, slotId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${eventId}/parking-slots/${slotId}`
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
