import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Booking } from '../../../../../models/booking.model';
import { BookingService } from '../../../../../services/booking';
import { BookingStateService } from '../../../../../core/services/booking-state.service';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { SeatLabelPipe } from '../../../../../shared/pipes/seat-label-pipe';
import { SlotCodePipe } from '../../../../../shared/pipes/slot-code-pipe';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterLink, ConfirmationDialog, SeatLabelPipe, SlotCodePipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private readonly bookingService = inject(BookingService);
  private readonly bookingState = inject(BookingStateService);
  private readonly router = inject(Router);

  readonly showConfirmation = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly booking = signal<Booking | null>(null);

  readonly event = this.bookingState.event;
  readonly seats = this.bookingState.selectedSeats;
  readonly parkingSlot = this.bookingState.selectedParkingSlot;

  get ticketTotal(): number {
    return (this.event()?.ticketPrice ?? 0) * this.seats().length;
  }

  get total(): number {
    return this.ticketTotal + (this.parkingSlot()?.fee ?? 0);
  }

  requestConfirmation(): void {
    this.errorMessage.set('');
    this.showConfirmation.set(true);
  }

  confirmBooking(): void {
    const event = this.event();
    if (!event || this.seats().length === 0) {
      this.errorMessage.set('Select at least one seat before creating a booking.');
      this.showConfirmation.set(false);
      return;
    }

    this.isSubmitting.set(true);
    this.bookingService.createBooking({
      eventId: event.eventId,
      seatIds: this.seats().map(seat => seat.seatId),
      parkingSlotId: this.parkingSlot()?.parkingSlotId ?? null,
    }).subscribe({
      next: (booking) => {
        this.booking.set(booking);
        this.bookingState.clearState();
        this.showConfirmation.set(false);
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => {
        this.showConfirmation.set(false);
        this.isSubmitting.set(false);
        this.handleBookingError(error, event.eventId);
      },
    });
  }

  private handleBookingError(error: unknown, eventId: number): void {
    const httpError = error as { status?: number; error?: { message?: string } };
    const message = httpError.error?.message ?? 'Unable to create the booking. Please try again.';

    if (httpError.status === 409) {
      const parkingConflict = message.toLowerCase().includes('parking');
      this.router.navigate(['/events', eventId, parkingConflict ? 'parking-selection' : 'seats']);
      return;
    }

    this.errorMessage.set(message);
  }
}
