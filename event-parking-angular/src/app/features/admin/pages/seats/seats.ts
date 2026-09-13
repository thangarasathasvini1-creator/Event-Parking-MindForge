import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

export interface RowGroup {
  rowName: string;
  seats: Seat[];
}

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
  readonly Math = Math;
  private readonly seatService = inject(SeatService);
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly events = signal<Event[]>([]);
  readonly selectedEventId = signal<number | null>(null);
  readonly seats = signal<Seat[]>([]);

  readonly viewMode = signal<'grid' | 'table'>('grid');

  readonly isLoadingEvents = signal(false);
  readonly isLoadingSeats = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDeleting = signal(false);
  readonly generating = signal(false);

  readonly errorMessage = signal('');
  readonly modalErrorMessage = signal('');
  readonly successMessage = signal('');

  readonly searchQuery = signal('');
  readonly statusFilter = signal('ALL');

  // Bulk Generator State
  readonly isBulkModalOpen = signal(false);
  readonly showGenerateConfirmation = signal(false);
  columns = 10;
  vipCount = 0;

  get capacity(): number {
    return this.events().find((e) => e.eventId === this.selectedEventId())?.capacity || 0;
  }

  // Selected Event computed
  readonly currentEvent = computed(() => {
    const id = this.selectedEventId();
    return this.events().find((e) => e.eventId === id) || null;
  });

  // Seat Stats computed
  readonly totalSeatsCount = computed(() => this.seats().length);
  readonly availableSeatsCount = computed(
    () => this.seats().filter((s) => s.status === 'Available').length
  );
  readonly heldSeatsCount = computed(
    () => this.seats().filter((s) => s.status === 'Held').length
  );
  readonly bookedSeatsCount = computed(
    () => this.seats().filter((s) => s.status === 'Booked').length
  );
  readonly vipSeatsCount = computed(
    () => this.seats().filter((s) => (s.status || '').toLowerCase() === 'vip').length
  );

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

  // Grouped by Row for the Visual Seat Map Layout
  readonly seatsByRow = computed<RowGroup[]>(() => {
    const allSeats = [...this.seats()];
    if (allSeats.length === 0) return [];

    // Group by row
    const map = new Map<string, Seat[]>();
    for (const s of allSeats) {
      const r = s.row ? `Row ${s.row}` : 'General';
      if (!map.has(r)) {
        map.set(r, []);
      }
      map.get(r)!.push(s);
    }

    // Sort seats in each row by column or seatNumber
    const result: RowGroup[] = [];
    for (const [rowName, rowSeats] of map.entries()) {
      rowSeats.sort((a, b) => {
        const colA = Number(a.column) || 0;
        const colB = Number(b.column) || 0;
        if (colA !== colB) return colA - colB;
        return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true });
      });
      result.push({ rowName, seats: rowSeats });
    }

    // Sort rows numerically (Row 1, Row 2... Row 100) and ensure VIP rows appear first
    result.sort((a, b) => {
      const numA = parseInt(a.rowName.replace(/\D/g, ''), 10);
      const numB = parseInt(b.rowName.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (a.rowName.toLowerCase().includes('vip')) return -1;
      if (b.rowName.toLowerCase().includes('vip')) return 1;
      return a.rowName.localeCompare(b.rowName, undefined, { numeric: true });
    });
    return result;
  });

  isRowVip(group: RowGroup): boolean {
    return group.seats.some(s => (s.status || '').toUpperCase() === 'VIP');
  }

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
          const queryId = Number(this.route.snapshot.queryParams['eventId']);
          const targetId = queryId && eventList.some((e) => e.eventId === queryId)
            ? queryId
            : eventList[0].eventId;
          this.selectedEventId.set(targetId);
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

  onEventChange(eventIdVal: unknown): void {
    const eventId = Number(eventIdVal);
    if (eventId) {
      this.selectedEventId.set(eventId);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { eventId },
        queryParamsHandling: 'merge',
      });
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

  openBulkModal(): void {
    this.isBulkModalOpen.set(true);
  }

  closeBulkModal(): void {
    this.isBulkModalOpen.set(false);
    this.showGenerateConfirmation.set(false);
  }

  generate(): void {
    const id = this.selectedEventId();
    if (!id || this.generating()) return;

    this.showGenerateConfirmation.set(false);
    this.generating.set(true);
    this.errorMessage.set('');

    this.seatService.generateMap(id, this.capacity, Number(this.columns), Number(this.vipCount) || 0).subscribe({
      next: () => {
        this.generating.set(false);
        this.closeBulkModal();
        this.showSuccess(`Successfully generated full seat map with ${this.capacity} seats!`);
        this.loadSeats();
      },
      error: (e) => {
        this.generating.set(false);
        this.errorMessage.set(e.error?.message || 'Unable to generate the seat map.');
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

  deleteSeat(): void {
    const eventId = this.selectedEventId();
    const seat = this.deletingSeat();
    if (!eventId || !seat) return;

    this.isDeleting.set(true);

    this.seatService.deleteSeat(eventId, seat.seatId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.cancelDelete();
        this.showSuccess(`Seat "${seat.seatNumber}" deleted successfully.`);
        this.loadSeats();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.cancelDelete();
        this.errorMessage.set(
          err?.error?.message || 'Failed to delete seat.'
        );
      },
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set('');
    }, 4000);
  }
}
