import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ParkingSlot } from '../../../../../models/parking.model';
import { ParkingService } from '../../../../../services/parking';
import { BookingStateService } from '../../../../../core/services/booking-state.service';
import { ParkingSlotButton } from '../../../../../shared/components/parking-slot-button/parking-slot-button';
import { SlotCodePipe } from '../../../../../shared/pipes/slot-code-pipe';

@Component({
  selector: 'app-parking-selection',
  imports: [CommonModule, RouterLink, ParkingSlotButton, SlotCodePipe],
  templateUrl: './parking-selection.html',
  styleUrl: './parking-selection.css',
})
export class ParkingSelection implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly parkingService = inject(ParkingService);
  private readonly bookingState = inject(BookingStateService);

  readonly slots = signal<ParkingSlot[]>([]);
  readonly selectedSlot = signal<ParkingSlot | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly selectionMessage = signal('');

  eventId = 0;

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

    this.loadParkingSlots();
  }

  loadParkingSlots(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.parkingService.getParkingSlotsByEvent(this.eventId).subscribe({
      next: (slots) => {
        const sortedSlots = [...slots].sort((first, second) =>
          first.slotNumber.localeCompare(second.slotNumber, undefined, { numeric: true })
        );

        this.slots.set(sortedSlots);
        this.clearUnavailableSelection(sortedSlots);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        const message = this.getErrorMessage(error);
        this.errorMessage.set(`Unable to load parking slots. ${message}`);
        this.isLoading.set(false);
      },
    });
  }

  selectSlot(slot: ParkingSlot): void {
    if (slot.status.toLowerCase() !== 'available') {
      return;
    }

    const selectedSlot = this.selectedSlot();
    const nextSlot = selectedSlot?.parkingSlotId === slot.parkingSlotId ? null : slot;

    this.selectedSlot.set(nextSlot);
    this.bookingState.setParkingSlot(nextSlot);
    this.selectionMessage.set(
      nextSlot
        ? `${nextSlot.slotNumber} is selected. You can change or skip parking before checkout.`
        : 'Parking selection removed. Parking is optional.'
    );
  }

  isSelected(parkingSlotId: number): boolean {
    return this.selectedSlot()?.parkingSlotId === parkingSlotId;
  }

  skipParking(): void {
    this.selectedSlot.set(null);
    this.bookingState.setParkingSlot(null);
    this.selectionMessage.set('No parking selected. Your ticket booking can continue without parking.');
  }

  continueToCheckout(): void {
    this.bookingState.setParkingSlot(this.selectedSlot());
    this.router.navigate(['/events', this.eventId, 'checkout']);
  }

  continueWithoutParking(): void {
    this.skipParking();
    this.router.navigate(['/events', this.eventId, 'checkout']);
  }

  private clearUnavailableSelection(slots: ParkingSlot[]): void {
    const selectedSlot = this.selectedSlot();
    if (!selectedSlot) {
      return;
    }

    const refreshedSlot = slots.find(slot => slot.parkingSlotId === selectedSlot.parkingSlotId);
    if (!refreshedSlot || refreshedSlot.status.toLowerCase() !== 'available') {
      this.selectedSlot.set(null);
      this.bookingState.setParkingSlot(null);
      this.selectionMessage.set('Your previously selected parking slot is no longer available. Please choose another slot or continue without parking.');
    }
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
