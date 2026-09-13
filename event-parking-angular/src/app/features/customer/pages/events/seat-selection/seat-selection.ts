import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Seat } from '../../../../../models/seat.model';
import { Event } from '../../../../../models/event.model';
import { SeatService } from '../../../../../services/seat';
import { EventService } from '../../../../../services/event';
import { BookingStateService } from '../../../../../core/services/booking-state.service';
import { SeatButton } from '../../../../../shared/components/seat-button/seat-button';
import { SeatLabelPipe } from '../../../../../shared/pipes/seat-label-pipe';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [
    CommonModule,
    SeatButton,
    SeatLabelPipe,
    LoadingSpinner,
    ErrorMessage,
    EmptyState
  ],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})

export class SeatSelection implements OnInit {

  private readonly seatService = inject(SeatService);
  private readonly eventService = inject(EventService);
  private readonly bookingState = inject(BookingStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly seats = signal<Seat[]>([]);
  readonly selectedSeats = signal<Seat[]>([]);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly conflictMessage = signal('');

  eventId = 0;
  readonly event = signal<Event | null>(null);

  ngOnInit(): void {
    this.eventId = Number(
      this.route.snapshot.paramMap.get('eventId')
    );

    if (!this.eventId) {
      this.errorMessage.set('Invalid event.');
      return;
    }

    // Pre-fill from state if coming back
    const stateEvent = this.bookingState.event();
    if (stateEvent && stateEvent.eventId === this.eventId) {
      this.selectedSeats.set([...this.bookingState.selectedSeats()]);
    }

    this.loadEvent();
    this.loadSeats();
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => this.event.set(event),
      error: () => this.errorMessage.set('Failed to load event details.')
    });
  }

  loadSeats(isRefresh = false): void {
    this.isLoading.set(true);
    if (!isRefresh) {
      this.errorMessage.set('');
    }

    this.seatService.getSeatsByEvent(this.eventId).subscribe({
      next: (seats: Seat[]) => {
        const sortedSeats = this.sortSeats(seats);
        this.seats.set(sortedSeats);
        this.removeUnavailableSelections(sortedSeats, isRefresh);
        this.isLoading.set(false);
      },

      error: (error: any) => {
        console.error('Failed to load seats:', error);

        if (error?.status === 409) {
          this.handleConflict();
        } else {
          this.errorMessage.set(
            'Unable to load seat availability. Please try again.'
          );
        }

        this.isLoading.set(false);
      }
    });
  }

  refreshSeats(): void {
    this.loadSeats(true);
  }

  toggleSeat(seat: Seat): void {
    if ((seat.status || '').toLowerCase() !== 'available') {
      return;
    }

    const currentSelected = this.selectedSeats();
    const index = currentSelected.findIndex(s => s.seatId === seat.seatId);

    if (index >= 0) {
      const updated = currentSelected.filter(s => s.seatId !== seat.seatId);
      this.selectedSeats.set(updated);
      this.bookingState.setSelectedSeats(updated);
    } else {
      const updated = [...currentSelected, seat];
      this.selectedSeats.set(updated);
      this.bookingState.setSelectedSeats(updated);
    }

    this.errorMessage.set('');
    this.conflictMessage.set('');
  }

  isSelected(seatId: number): boolean {
    return this.selectedSeats().some(s => s.seatId === seatId);
  }

  private sortSeats(seats: Seat[]): Seat[] {
    return [...seats].sort((first, second) => {
      const rowDifference = this.getPosition(first.row) - this.getPosition(second.row);

      if (rowDifference !== 0) {
        return rowDifference;
      }

      return this.getPosition(first.column) - this.getPosition(second.column);
    });
  }

  private getPosition(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') {
      return value;
    }

    return Number(String(value).match(/\d+/)?.[0] ?? 0);
  }

  private removeUnavailableSelections(seats: Seat[], isRefresh = false): void {
    const availableSeatIds = new Set(
      seats
        .filter(seat => (seat.status || '').toLowerCase() === 'available')
        .map(seat => seat.seatId)
    );
    const availableSelections = this.selectedSeats().filter(seat =>
      availableSeatIds.has(seat.seatId)
    );

    if (availableSelections.length !== this.selectedSeats().length) {
      this.selectedSeats.set(availableSelections);
      this.bookingState.setSelectedSeats(availableSelections);
      this.conflictMessage.set(
        'One or more of your selected seats are no longer available. We have refreshed the seat map.'
      );
    } else if (isRefresh) {
      this.conflictMessage.set('Seat map refreshed successfully.');
      setTimeout(() => this.conflictMessage.set(''), 3000);
    }
  }

  handleConflict(): void {
    this.conflictMessage.set(
      'One or more selected seats are no longer available. Re-fetching seat availability...'
    );
    this.loadSeats(true);
  }

  get totalPrice(): number {
    const event = this.event();
    return event ? this.selectedSeats().length * (event.ticketPrice || 0) : 0;
  }

  continueToParking(): void {
    if (this.selectedSeats().length === 0) {
      this.errorMessage.set('Please select at least one seat to continue.');
      return;
    }

    // Save to shared state
    const event = this.event();
    if (event) {
      this.bookingState.setEvent(event);
    }
    
    this.bookingState.setSelectedSeats(this.selectedSeats());

    this.router.navigate([
      '/events',
      this.eventId,
      'parking-selection'
    ]);
  }

  navigateBack(): void {
    this.router.navigate(['/events', this.eventId]);
  }
}

