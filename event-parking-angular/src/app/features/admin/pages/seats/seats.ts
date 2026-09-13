import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Seat, CreateSeatDto, UpdateSeatDto } from '../../../../models/seat.model';
import { Event } from '../../../../models/event.model';
import { SeatService } from '../../../../services/seat';
import { EventService } from '../../../../services/event';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-seats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinner,
    EmptyState,
    ConfirmationDialog,
    StatusBadge,
  ],
  templateUrl: './seats.html',
  styleUrl: './seats.css',
})

export class Seats implements OnInit {
  private readonly seatService = inject(SeatService);
  private readonly eventService = inject(EventService);

  readonly events = signal<Event[]>([]);
  readonly selectedEventId = signal<number | null>(null);
  readonly seats = signal<Seat[]>([]);

  readonly isLoadingEvents = signal(false);
  readonly isLoadingSeats = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDeleting = signal(false);

  readonly errorMessage = signal('');
  readonly modalErrorMessage = signal('');
  readonly successMessage = signal('');

  readonly searchQuery = signal('');
  readonly statusFilter = signal('ALL');

  // Modal State
  readonly isFormModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly editingSeatId = signal<number | null>(null);

  // Form Fields
  seatNumber = '';
  row = '';
  column = '';
  status = 'Available';

  // Delete Confirmation State
  readonly isDeleteDialogOpen = signal(false);
  readonly deletingSeat = signal<Seat | null>(null);

  // Filtered Seats computed property
  readonly filteredSeats = computed(() => {
    let result = this.seats();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (query) {
      result = result.filter(
        (s) =>
          s.seatNumber.toLowerCase().includes(query) ||
          String(s.row || '').toLowerCase().includes(query) ||
          String(s.column || '').toLowerCase().includes(query)
      );
    }

    if (status !== 'ALL') {
      result = result.filter(
        (s) => (s.status || '').trim().toLowerCase() === status.toLowerCase()
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
          this.loadSeats();
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
      this.loadSeats();
    }
  }

  loadSeats(): void {
    const eventId = this.selectedEventId();
    if (!eventId) return;

    this.isLoadingSeats.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.seatService.getSeatsByEvent(eventId).subscribe({
      next: (seatList) => {
        this.seats.set(seatList);
        this.isLoadingSeats.set(false);
      },
      error: (err) => {
        console.error('Failed to load seats:', err);
        this.errorMessage.set('Failed to load seats for the selected event.');
        this.isLoadingSeats.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingSeatId.set(null);
    this.seatNumber = '';
    this.row = '';
    this.column = '';
    this.status = 'Available';
    this.modalErrorMessage.set('');
    this.isFormModalOpen.set(true);
  }

  openEditModal(seat: Seat): void {
    this.isEditMode.set(true);
    this.editingSeatId.set(seat.seatId);
    this.seatNumber = seat.seatNumber;
    this.row = seat.row != null ? String(seat.row) : '';
    this.column = seat.column != null ? String(seat.column) : '';
    this.status = seat.status || 'Available';
    this.modalErrorMessage.set('');
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.modalErrorMessage.set('');
  }

  saveSeat(): void {
    const eventId = this.selectedEventId();
    if (!eventId) {
      this.modalErrorMessage.set('Please select an event first.');
      return;
    }

    if (!this.seatNumber.trim()) {
      this.modalErrorMessage.set('Seat Number is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.modalErrorMessage.set('');

    if (this.isEditMode()) {
      const seatId = this.editingSeatId();
      if (!seatId) return;

      const dto: UpdateSeatDto = {
        seatNumber: this.seatNumber.trim(),
        row: this.row.trim() || null,
        column: this.column.trim() || null,
        status: this.status,
      };

      this.seatService.updateSeat(eventId, seatId, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.showSuccess('Seat updated successfully.');
          this.loadSeats();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.modalErrorMessage.set(
            err?.error?.message || 'Failed to update seat.'
          );
        },
      });
    } else {
      const dto: CreateSeatDto = {
        seatNumber: this.seatNumber.trim(),
        row: this.row.trim() || null,
        column: this.column.trim() || null,
      };

      this.seatService.createSeat(eventId, dto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.showSuccess('Seat created successfully.');
          this.loadSeats();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.modalErrorMessage.set(
            err?.error?.message || 'Failed to create seat.'
          );
        },
      });
    }
  }

  confirmDelete(seat: Seat): void {
    this.deletingSeat.set(seat);
    this.isDeleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.isDeleteDialogOpen.set(false);
    this.deletingSeat.set(null);
  }

  deleteSeatConfirmed(): void {
    const eventId = this.selectedEventId();
    const seat = this.deletingSeat();
    if (!eventId || !seat) return;

    this.isDeleting.set(true);

    this.seatService.deleteSeat(eventId, seat.seatId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.isDeleteDialogOpen.set(false);
        this.deletingSeat.set(null);
        this.showSuccess(`Seat ${seat.seatNumber} deleted successfully.`);
        this.loadSeats();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.isDeleteDialogOpen.set(false);
        this.deletingSeat.set(null);
        this.errorMessage.set(
          err?.error?.message || 'Failed to delete seat. It may be part of an existing booking.'
        );
      },
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
