import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { VenueService } from '../../../../../services/venue';
import { Venue } from '../../../../../models/venue.model';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-venue-list',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmationDialog,
    LoadingSpinner,
    ErrorMessage,
    EmptyState,
  ],
  templateUrl: './venue-list.html',
  styleUrl: './venue-list.css',
})
export class VenueList implements OnInit {
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);

  readonly venues = signal<Venue[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly pendingVenueToDelete = signal<Venue | null>(null);
  readonly showDeleteModal = signal(false);
  readonly isDeleting = signal(false);

  ngOnInit(): void {
    this.loadVenues();
  }

  createVenue(): void {
    this.router.navigate(['/admin/venues/new']);
  }

  editVenue(venueId: number): void {
    this.router.navigate(['/admin/venues', venueId, 'edit']);
  }

  checkAvailability(): void {
    this.router.navigate(['/admin/venues/availability']);
  }

  initiateDelete(venue: Venue): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingVenueToDelete.set(venue);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.pendingVenueToDelete.set(null);
    this.showDeleteModal.set(false);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const venue = this.pendingVenueToDelete();
    if (!venue?.venueId) {
      this.cancelDelete();
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.venueService.deleteVenue(venue.venueId).subscribe({
      next: () => {
        this.venues.update((venues) =>
          venues.filter((v) => v.venueId !== venue.venueId)
        );
        this.successMessage.set(`Venue "${venue.name}" was deleted successfully.`);
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Failed to delete venue:', error);
        this.isDeleting.set(false);

        if (error?.status === 409) {
          this.errorMessage.set(
            `Cannot delete "${venue.name}" because active or upcoming events are scheduled at this venue. Reassign or delete those events first.`
          );
        } else {
          this.errorMessage.set(
            error?.error?.message ??
              `Unable to delete "${venue.name}". It may have active bookings or dependent records.`
          );
        }

        this.showDeleteModal.set(false);
      },
    });
  }

  private loadVenues(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.venueService.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load venues:', error);
        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load venues. Please check your connection and try again.'
        );
        this.isLoading.set(false);
      },
    });
  }

  retry(): void {
    this.loadVenues();
  }
}