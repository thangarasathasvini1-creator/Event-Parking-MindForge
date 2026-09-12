import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Seat } from '../../../../../models/seat.model';
import { Event } from '../../../../../models/event.model';
import { SeatService } from '../../../../../services/seat';
import { EventService } from '../../../../../services/event';
import { BookingStateService } from '../../../../../core/services/booking-state.service';
import { SeatButton } from '../../../../../shared/components/seat-button/seat-button';
import { SeatLabelPipe } from '../../../../../shared/pipes/seat-label-pipe';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, SeatButton, SeatLabelPipe],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})
export class SeatSelection implements OnInit {

  private readonly seatService = inject(SeatService);
  private readonly eventService = inject(EventService);
  private readonly bookingState = inject(BookingStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  seats: Seat[] = [];
  selectedSeats: Seat[] = [];

  isLoading = false;
  errorMessage = '';

  eventId = 0;
  event: Event | null = null;

  ngOnInit(): void {
    this.eventId = Number(
      this.route.snapshot.paramMap.get('eventId')
    );

    if (!this.eventId) {
      this.errorMessage = 'Invalid event.';
      return;
    }

    // Pre-fill from state if coming back
    const stateEvent = this.bookingState.event();
    if (stateEvent && stateEvent.eventId === this.eventId) {
      this.selectedSeats = [...this.bookingState.selectedSeats()];
    }

    this.loadEvent();
    this.loadSeats();
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => this.event = event,
      error: () => this.errorMessage = 'Failed to load event details.'
    });
  }

  loadSeats(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.seatService.getSeatsByEvent(this.eventId).subscribe({
      next: (seats: Seat[]) => {
        this.seats = seats;
        this.isLoading = false;
      },

      error: (error: any) => {
        console.error('Failed to load seats:', error);

        this.errorMessage =
          'Unable to load seats. Error: ' + (error.message || JSON.stringify(error));

        this.isLoading = false;
      }
    });
  }

  toggleSeat(seat: Seat): void {
    if (seat.status.toLowerCase() !== 'available') {
      return;
    }

    const index = this.selectedSeats.findIndex(s => s.seatId === seat.seatId);

    if (index >= 0) {
      this.selectedSeats.splice(index, 1);
    } else {
      this.selectedSeats.push(seat);
    }

    this.errorMessage = '';
  }

  isSelected(seatId: number): boolean {
    return this.selectedSeats.some(s => s.seatId === seatId);
  }

  get totalPrice(): number {
    if (!this.event) return 0;
    return this.selectedSeats.length * this.event.ticketPrice;
  }

  continueToParking(): void {
    if (this.selectedSeats.length === 0) {
      this.errorMessage =
        'Please select at least one seat.';
      return;
    }

    // Save to shared state
    if (this.event) {
      this.bookingState.setEvent(this.event);
    }
    
    // We can clear and re-add or implement a setSeats method
    this.bookingState.clearSeats();
    for (const seat of this.selectedSeats) {
      this.bookingState.toggleSeat(seat);
    }

    console.log(
      'Selected seats saved to state:',
      this.selectedSeats
    );

    this.router.navigate([
      '/events',
      this.eventId,
      'parking-selection'
    ]);
  }
}