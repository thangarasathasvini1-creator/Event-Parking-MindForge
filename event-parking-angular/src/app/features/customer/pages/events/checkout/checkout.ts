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
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ConfirmationDialog,
    SeatLabelPipe,
    SlotCodePipe
  ],
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


  // ==================== TOTALS ====================

  get ticketTotal(): number {
    return (
      (this.event()?.ticketPrice ?? 0) *
      this.seats().length
    );
  }

  get total(): number {
    return (
      this.ticketTotal +
      (this.parkingSlot()?.fee ?? 0)
    );
  }


  // ==================== CONFIRMATION ====================

  requestConfirmation(): void {
    this.errorMessage.set('');
    this.showConfirmation.set(true);
  }


  // ==================== CREATE BOOKING ====================

  confirmBooking(): void {

    const event = this.event();
    const seats = this.seats();
    const parkingSlot = this.parkingSlot();

    if (!event) {
      this.errorMessage.set(
        'Event information is not available.'
      );

      this.showConfirmation.set(false);
      return;
    }

    if (seats.length === 0) {
      this.errorMessage.set(
        'Select at least one seat before creating a booking.'
      );

      this.showConfirmation.set(false);
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.bookingService
      .createBooking({
        eventId: event.eventId,
        seatIds: seats.map(
          seat => seat.seatId
        ),
        parkingSlotId:
          parkingSlot?.parkingSlotId ?? null,
      })
      .subscribe({

        // ==================== SUCCESS ====================

        next: (booking: Booking) => {

          this.booking.set(booking);

          this.showConfirmation.set(false);
          this.isSubmitting.set(false);

          /*
           * BookingState is no longer required after
           * the booking has been successfully created.
           */
          this.bookingState.clearState();

          /*
           * Continue directly to payment.
           */
          this.router.navigate([
            '/bookings',
            booking.bookingId,
            'payment'
          ]);
        },


        // ==================== ERROR ====================

        error: (error: unknown) => {

          this.showConfirmation.set(false);
          this.isSubmitting.set(false);

          this.handleBookingError(
            error,
            event.eventId
          );
        },

      });
  }


  // ==================== BOOKING ERROR ====================

  private handleBookingError(
    error: unknown,
    eventId: number
  ): void {

    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };

    const message =
      httpError.error?.message ??
      'Unable to create the booking. Please try again.';


    // ==================== CONFLICT ====================

    if (httpError.status === 409) {

      const parkingConflict =
        message
          .toLowerCase()
          .includes('parking');

      this.router.navigate([
        '/events',
        eventId,
        parkingConflict
          ? 'parking-selection'
          : 'seats'
      ]);

      return;
    }


    // ==================== VALIDATION ====================

    if (httpError.status === 400) {

      this.errorMessage.set(
        message
      );

      return;
    }


    // ==================== UNAUTHORIZED ====================

    if (httpError.status === 401) {

      this.errorMessage.set(
        'Your session has expired. Please log in again.'
      );

      return;
    }


    // ==================== FORBIDDEN ====================

    if (httpError.status === 403) {

      this.errorMessage.set(
        'You do not have permission to create this booking.'
      );

      return;
    }


    // ==================== NOT FOUND ====================

    if (httpError.status === 404) {

      this.errorMessage.set(
        'The selected event could not be found.'
      );

      return;
    }


    // ==================== SERVER ERROR ====================

    if (
      httpError.status !== undefined &&
      httpError.status >= 500
    ) {

      this.errorMessage.set(
        'The server is temporarily unavailable. Please try again later.'
      );

      return;
    }


    // ==================== DEFAULT ====================

    this.errorMessage.set(
      message
    );
  }
}