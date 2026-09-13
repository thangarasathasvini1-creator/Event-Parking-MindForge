import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ParkingSlot } from '../../../../../models/parking.model';
import { Event } from '../../../../../models/event.model';
import { ParkingService } from '../../../../../services/parking';
import { EventService } from '../../../../../services/event';
import { BookingStateService } from '../../../../../core/services/booking-state.service';
import { ParkingSlotButton } from '../../../../../shared/components/parking-slot-button/parking-slot-button';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-parking-selection',
  standalone: true,
  imports: [
    CommonModule,
    ParkingSlotButton,
    LoadingSpinner,
    ErrorMessage,
    EmptyState
  ],
  templateUrl: './parking-selection.html',
  styleUrl: './parking-selection.css',
})

export class ParkingSelection implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly parkingService = inject(ParkingService);
  private readonly eventService = inject(EventService);
  private readonly bookingState = inject(BookingStateService);

  readonly slots = signal<ParkingSlot[]>([]);
  readonly selectedSlot = signal<ParkingSlot | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly selectionMessage = signal('');
  readonly conflictMessage = signal('');
  readonly selectedVehicleType = signal<string>('ALL');

  readonly vehicleFilterOptions = ['ALL', 'Car', 'Bike', 'Bus', 'Van'];

  eventId = 0;
  readonly event = signal<Event | null>(null);

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('eventId'));

    if (!this.eventId) {
      this.errorMessage.set('Invalid event.');
      return;
    }

    const savedSlot = this.bookingState.selectedParkingSlot();
    if (savedSlot?.eventId === this.eventId) {
      this.selectedSlot.set(savedSlot);
    }

    this.loadEvent();
    this.loadParkingSlots();
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (ev) => this.event.set(ev),
      error: () => {}
    });
  }

  loadParkingSlots(isRefresh = false): void {
    this.isLoading.set(true);
    if (!isRefresh) {
      this.errorMessage.set('');
    }

    const filter = this.selectedVehicleType();
    const request$ = (filter && filter !== 'ALL')
      ? this.parkingService.getAvailableParkingSlots(this.eventId, filter)
      : this.parkingService.getParkingSlotsByEvent(this.eventId);

    request$.subscribe({
      next: (slots) => {
        const sortedSlots = [...slots].sort((first, second) =>
          first.slotNumber.localeCompare(second.slotNumber, undefined, { numeric: true })
        );

        this.slots.set(sortedSlots);
        this.clearUnavailableSelection(sortedSlots, isRefresh);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        if (error?.status === 409) {
          this.handleConflict();
        } else {
          const message = this.getErrorMessage(error);
          this.errorMessage.set(`Unable to load parking slots. ${message}`);
        }
        this.isLoading.set(false);
      },
    });
  }

  refreshParking(): void {
    this.loadParkingSlots(true);
  }

  setVehicleFilter(type: string): void {
    this.selectedVehicleType.set(type);
    this.loadParkingSlots();
  }

  selectSlot(slot: ParkingSlot): void {
    if ((slot.status || '').toLowerCase() !== 'available') {
      return;
    }

    const currentSelected = this.selectedSlot();
    const nextSlot = currentSelected?.parkingSlotId === slot.parkingSlotId ? null : slot;

    this.selectedSlot.set(nextSlot);
    this.bookingState.setParkingSlot(nextSlot);
    this.conflictMessage.set('');
    this.selectionMessage.set(
      nextSlot
        ? `Parking slot ${nextSlot.slotNumber} selected (Fee: LKR ${nextSlot.fee}).`
        : 'Parking selection cleared. Parking is optional.'
    );
  }

  isSelected(parkingSlotId: number): boolean {
    return this.selectedSlot()?.parkingSlotId === parkingSlotId;
  }

  skipParking(): void {
    this.selectedSlot.set(null);
    this.bookingState.setParkingSlot(null);
    this.selectionMessage.set('No parking selected. Continuing without parking.');
  }

  continueToCheckout(): void {
    this.bookingState.setParkingSlot(this.selectedSlot());
    this.router.navigate(['/events', this.eventId, 'checkout']);
  }

  continueWithoutParking(): void {
    this.skipParking();
    this.router.navigate(['/events', this.eventId, 'checkout']);
  }

  navigateBackToSeats(): void {
    this.router.navigate(['/events', this.eventId, 'seats']);
  }

  private clearUnavailableSelection(slots: ParkingSlot[], isRefresh = false): void {
    const selectedSlot = this.selectedSlot();
    if (!selectedSlot) {
      return;
    }

    const refreshedSlot = slots.find(slot => slot.parkingSlotId === selectedSlot.parkingSlotId);
    if (!refreshedSlot || (refreshedSlot.status || '').toLowerCase() !== 'available') {
      this.selectedSlot.set(null);
      this.bookingState.setParkingSlot(null);
      this.conflictMessage.set('That parking slot is no longer available. Please choose another slot or continue without parking.');
    } else if (isRefresh) {
      this.conflictMessage.set('Parking map refreshed successfully.');
      setTimeout(() => this.conflictMessage.set(''), 3000);
    }
  }

  handleConflict(): void {
    this.conflictMessage.set(
      'Selected parking slot conflict detected. Re-fetching parking slot availability...'
    );
    this.loadParkingSlots(true);
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = (error as { error?: { message?: string } }).error;
      if (body?.message) {
        return body.message;
      }
    }

    return 'Please try again.';
  }
}

