import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ParkingSlot, CreateParkingSlotDto, UpdateParkingSlotDto } from '../../../../models/parking.model';
import { Event } from '../../../../models/event.model';
import { ParkingService } from '../../../../services/parking';
import { EventService } from '../../../../services/event';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-parking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinner,
    EmptyState,
    ConfirmationDialog,
    StatusBadge,
  ],
  templateUrl: './parking.html',
  styleUrl: './parking.css',
})

export class Parking implements OnInit {
  private readonly parkingService = inject(ParkingService);
  private readonly eventService = inject(EventService);

  readonly events = signal<Event[]>([]);
  readonly selectedEventId = signal<number | null>(null);
  readonly slots = signal<ParkingSlot[]>([]);

  readonly isLoadingEvents = signal(false);
  readonly isLoadingSlots = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDeleting = signal(false);

  readonly errorMessage = signal('');
  readonly modalErrorMessage = signal('');
  readonly successMessage = signal('');

  readonly searchQuery = signal('');
  readonly vehicleFilter = signal('ALL');
  readonly statusFilter = signal('ALL');

  readonly vehicleTypes = ['Car', 'Bike', 'Bus', 'Van'];

  // Modal State
  readonly isFormModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly editingSlotId = signal<number | null>(null);

  // Form Fields
  slotNumber = '';
  zone = '';
  vehicleType = 'Car';
  fee = 0;
  status = 'Available';

  // Delete Confirmation State
  readonly isDeleteDialogOpen = signal(false);
  readonly deletingSlot = signal<ParkingSlot | null>(null);

  // Filtered Slots computed property
  readonly filteredSlots = computed(() => {
    let result = this.slots();
    const query = this.searchQuery().trim().toLowerCase();
    const vFilter = this.vehicleFilter();
    const sFilter = this.statusFilter();

    if (query) {
      result = result.filter(
        (s) =>
          s.slotNumber.toLowerCase().includes(query) ||
          String(s.zone || '').toLowerCase().includes(query)
      );
    }

    if (vFilter !== 'ALL') {
      result = result.filter(
        (s) => (s.vehicleType || '').trim().toLowerCase() === vFilter.toLowerCase()
      );
    }

    if (sFilter !== 'ALL') {
      result = result.filter(
        (s) => (s.status || '').trim().toLowerCase() === sFilter.toLowerCase()
      );
    }

    return result;
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoadingEvents.set(true);
    this.errorMessage.set('');

    this.eventService.getEvents().subscribe({
      next: (eventList) => {
        this.events.set(eventList);
        this.isLoadingEvents.set(false);

        if (eventList.length > 0) {
          this.selectedEventId.set(eventList[0].eventId);
          this.loadSlots();
        }
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        this.errorMessage.set('Failed to load events list.');
        this.isLoadingEvents.set(false);
      },
    });
  }

  onEventChange(eventIdStr: string): void {
    const eventId = Number(eventIdStr);
    if (eventId) {
      this.selectedEventId.set(eventId);
      this.loadSlots();
    }
  }

  loadSlots(): void {
    const eventId = this.selectedEventId();
    if (!eventId) return;

    this.isLoadingSlots.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.parkingService.getParkingSlotsByEvent(eventId).subscribe({
      next: (slotList) => {
        this.slots.set(slotList);
        this.isLoadingSlots.set(false);
      },
      error: (err) => {
        console.error('Failed to load parking slots:', err);
        this.errorMessage.set('Failed to load parking slots for the selected event.');
        this.isLoadingSlots.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingSlotId.set(null);
    this.slotNumber = '';
    this.zone = '';
    this.vehicleType = 'Car';
    this.fee = 0;
    this.status = 'Available';
    this.modalErrorMessage.set('');
    this.isFormModalOpen.set(true);
  }

  openEditModal(slot: ParkingSlot): void {
    this.isEditMode.set(true);
    this.editingSlotId.set(slot.parkingSlotId);
    this.slotNumber = slot.slotNumber;
    this.zone = slot.zone || '';
    this.vehicleType = slot.vehicleType || 'Car';
    this.fee = slot.fee || 0;
    this.status = slot.status || 'Available';
    this.modalErrorMessage.set('');
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.modalErrorMessage.set('');
  }

  saveSlot(): void {
    const eventId = this.selectedEventId();
    if (!eventId) {
      this.modalErrorMessage.set('Please select an event first.');
      return;
    }

    if (!this.slotNumber.trim()) {
      this.modalErrorMessage.set('Slot Number is required.');
      return;
    }

    if (this.fee < 0) {
      this.modalErrorMessage.set('Fee cannot be negative.');
      return;
    }

    this.isSubmitting.set(true);
    this.modalErrorMessage.set('');

    if (this.isEditMode()) {
      const slotId = this.editingSlotId();
      if (!slotId) return;

      const dto: UpdateParkingSlotDto = {
        slotNumber: this.slotNumber.trim(),
        zone: this.zone.trim() || null,
        vehicleType: this.vehicleType,
        fee: Number(this.fee),
        status: this.status,
      };

      this.parkingService.updateParkingSlot(eventId, slotId, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.showSuccess('Parking slot updated successfully.');
          this.loadSlots();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.modalErrorMessage.set(
            err?.error?.message || 'Failed to update parking slot.'
          );
        },
      });
    } else {
      const dto: CreateParkingSlotDto = {
        slotNumber: this.slotNumber.trim(),
        zone: this.zone.trim() || null,
        vehicleType: this.vehicleType,
        fee: Number(this.fee),
      };

      this.parkingService.createParkingSlot(eventId, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.showSuccess('Parking slot created successfully.');
          this.loadSlots();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.modalErrorMessage.set(
            err?.error?.message || 'Failed to create parking slot.'
          );
        },
      });
    }
  }

  confirmDelete(slot: ParkingSlot): void {
    this.deletingSlot.set(slot);
    this.isDeleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.isDeleteDialogOpen.set(false);
    this.deletingSlot.set(null);
  }

  deleteSlotConfirmed(): void {
    const eventId = this.selectedEventId();
    const slot = this.deletingSlot();
    if (!eventId || !slot) return;

    this.isDeleting.set(true);

    this.parkingService.deleteParkingSlot(eventId, slot.parkingSlotId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.isDeleteDialogOpen.set(false);
        this.deletingSlot.set(null);
        this.showSuccess(`Parking slot ${slot.slotNumber} deleted successfully.`);
        this.loadSlots();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.isDeleteDialogOpen.set(false);
        this.deletingSlot.set(null);
        this.errorMessage.set(
          err?.error?.message || 'Failed to delete parking slot. It may be part of an active booking.'
        );
      },
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
