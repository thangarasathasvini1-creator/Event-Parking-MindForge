import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

export interface ZoneGroup {
  zoneName: string;
  slots: ParkingSlot[];
  availableCount: number;
  totalCount: number;
}

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
  readonly Math = Math;
  private readonly parkingService = inject(ParkingService);
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly events = signal<Event[]>([]);
  readonly selectedEventId = signal<number | null>(null);
  readonly slots = signal<ParkingSlot[]>([]);

  readonly viewMode = signal<'grid' | 'table'>('grid');

  readonly isLoadingEvents = signal(false);
  readonly isLoadingSlots = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDeleting = signal(false);
  readonly generating = signal(false);

  readonly errorMessage = signal('');
  readonly modalErrorMessage = signal('');
  readonly successMessage = signal('');

  readonly searchQuery = signal('');
  readonly vehicleFilter = signal('ALL');
  readonly statusFilter = signal('ALL');

  readonly vehicleTypes = ['Car', 'Bike', 'Bus', 'Van'];

  // Bulk Zone Generator State
  readonly isBulkModalOpen = signal(false);
  generateCount = 10;
  generateZone = 'Zone A';
  generateFee = 500;
  generateVehicle = 'Car';

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

  // Selected Event computed
  readonly currentEvent = computed(() => {
    const id = this.selectedEventId();
    return this.events().find((e) => e.eventId === id) || null;
  });

  // Slot Stats computed
  readonly totalSlotsCount = computed(() => this.slots().length);
  readonly availableSlotsCount = computed(
    () => this.slots().filter((s) => (s.status || '').toLowerCase() === 'available').length
  );
  readonly heldSlotsCount = computed(
    () => this.slots().filter((s) => (s.status || '').toLowerCase() === 'held').length
  );
  readonly occupiedSlotsCount = computed(
    () => this.slots().filter((s) => (s.status || '').toLowerCase() === 'occupied').length
  );
  readonly potentialRevenue = computed(
    () => this.slots().reduce((sum, s) => sum + (Number(s.fee) || 0), 0)
  );

  // Grouped by Zone for Visual Parking Map Layout
  readonly slotsByZone = computed<ZoneGroup[]>(() => {
    const allSlots = [...this.slots()];
    if (allSlots.length === 0) return [];

    const map = new Map<string, ParkingSlot[]>();
    for (const s of allSlots) {
      const z = s.zone ? s.zone.trim() : 'General';
      if (!map.has(z)) {
        map.set(z, []);
      }
      map.get(z)!.push(s);
    }

    const result: ZoneGroup[] = [];
    for (const [zoneName, zoneSlots] of map.entries()) {
      zoneSlots.sort((a, b) => {
        return a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true });
      });
      const available = zoneSlots.filter((s) => (s.status || '').toLowerCase() === 'available').length;
      result.push({
        zoneName,
        slots: zoneSlots,
        availableCount: available,
        totalCount: zoneSlots.length,
      });
    }

    result.sort((a, b) => a.zoneName.localeCompare(b.zoneName, undefined, { numeric: true }));
    return result;
  });

  openBulkModal(): void {
    const existingZones = new Set(this.slots().map((s) => (s.zone || '').trim()));
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'VIP', 'East', 'West'];
    let suggested = 'Zone A';
    for (const l of letters) {
      const candidate = l.length === 1 ? `Zone ${l}` : l;
      if (!existingZones.has(candidate)) {
        suggested = candidate;
        break;
      }
    }
    this.generateZone = suggested;
    this.generateCount = 10;
    this.generateFee = 500;
    this.generateVehicle = 'Car';
    this.modalErrorMessage.set('');
    this.isBulkModalOpen.set(true);
  }

  closeBulkModal(): void {
    this.isBulkModalOpen.set(false);
  }

  generate(): void {
    const id = this.selectedEventId();
    if (!id || this.generating()) return;

    if (!this.generateZone.trim()) {
      this.errorMessage.set('Zone name is required (e.g. Zone A).');
      return;
    }

    if (this.generateCount < 1 || this.generateCount > 1000) {
      this.errorMessage.set('Number of slots must be between 1 and 1000.');
      return;
    }

    if (this.generateFee < 0) {
      this.errorMessage.set('Parking fee cannot be negative.');
      return;
    }

    this.generating.set(true);
    this.errorMessage.set('');

    this.parkingService
      .generateLayout(
        id,
        Number(this.generateCount),
        this.generateZone.trim(),
        this.generateVehicle,
        Number(this.generateFee)
      )
      .subscribe({
        next: () => {
          this.generating.set(false);
          this.closeBulkModal();
          this.showSuccess(`Generated ${this.generateCount} parking slots for "${this.generateZone.trim()}"!`);
          this.loadSlots();
        },
        error: (e) => {
          this.generating.set(false);
          this.errorMessage.set(e.error?.message || 'Unable to generate parking layout.');
        },
      });
  }

  getVehicleIcon(vehicleType: string | undefined): string {
    switch ((vehicleType || '').toLowerCase()) {
      case 'bike':
      case 'motorcycle':
        return 'Bike';
      case 'bus':
        return 'Bus';
      case 'van':
        return 'Van';
      default:
        return 'Car';
    }
  }

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
          const queryId = Number(this.route.snapshot.queryParams['eventId']);
          const targetId = queryId && eventList.some((e) => e.eventId === queryId)
            ? queryId
            : eventList[0].eventId;
          this.selectedEventId.set(targetId);
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
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { eventId },
        queryParamsHandling: 'merge',
      });
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
