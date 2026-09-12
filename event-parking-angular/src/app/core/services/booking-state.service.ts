import { Injectable, signal } from '@angular/core';
import { Event } from '../../models/event.model';
import { Seat } from '../../models/seat.model';

// We import ParkingSlot here for later when parking is implemented, 
// using 'any' to avoid compilation error if the model isn't fully ready.
// Alternatively we can use unknown or just import the actual model if it exists.
// I saw parking.model.ts earlier, so I'll import it.
import { ParkingSlot } from '../../models/parking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingStateService {
  readonly event = signal<Event | null>(null);
  readonly selectedSeats = signal<Seat[]>([]);
  readonly selectedParkingSlot = signal<ParkingSlot | null>(null);

  setEvent(event: Event | null): void {
    this.event.set(event);
  }

  toggleSeat(seat: Seat): void {
    this.selectedSeats.update(seats => {
      const index = seats.findIndex(s => s.seatId === seat.seatId);
      if (index >= 0) {
        return seats.filter(s => s.seatId !== seat.seatId);
      } else {
        return [...seats, seat];
      }
    });
  }

  clearSeats(): void {
    this.selectedSeats.set([]);
  }

  setParkingSlot(slot: ParkingSlot | null): void {
    this.selectedParkingSlot.set(slot);
  }

  clearState(): void {
    this.event.set(null);
    this.selectedSeats.set([]);
    this.selectedParkingSlot.set(null);
  }
}
