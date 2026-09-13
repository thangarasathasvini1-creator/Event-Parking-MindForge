import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { VenueService } from '../../../../../services/venue';
import { Venue } from '../../../../../models/venue.model';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-venue-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinner, ErrorMessage, EmptyState],
  templateUrl: './venue-availability.html',
  styleUrl: './venue-availability.css',
})
export class VenueAvailability {
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);

  readonly venues = signal<Venue[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly hasSearched = signal(false);

  eventDate = '';
  startTime = '';
  endTime = '';

  goBack(): void {
    this.router.navigate(['/admin/venues']);
  }

  checkAvailability(): void {
    this.errorMessage.set('');
    this.hasSearched.set(false);

    if (!this.eventDate) {
      this.errorMessage.set('Event date is required.');
      return;
    }

    if (!this.startTime) {
      this.errorMessage.set('Start time is required.');
      return;
    }

    if (!this.endTime) {
      this.errorMessage.set('End time is required.');
      return;
    }

    if (this.startTime >= this.endTime) {
      this.errorMessage.set('End time must be later than start time.');
      return;
    }

    this.isLoading.set(true);

    const formattedStart = this.startTime.length === 5 ? `${this.startTime}:00` : this.startTime;
    const formattedEnd = this.endTime.length === 5 ? `${this.endTime}:00` : this.endTime;

    this.venueService
      .getAvailableVenues(this.eventDate, formattedStart, formattedEnd)
      .subscribe({
        next: (response) => {
          this.venues.set(response ?? []);
          this.hasSearched.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load available venues:', error);
          this.errorMessage.set(
            error?.error?.message ??
              'Unable to check venue availability. Please check the date/time and try again.'
          );
          this.isLoading.set(false);
        },
      });
  }
}