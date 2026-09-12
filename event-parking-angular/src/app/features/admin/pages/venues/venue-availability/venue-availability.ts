import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VenueService } from '../../../../../services/venue';
import { Venue } from '../../../../../models/venue.model';

@Component({
  selector: 'app-venue-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './venue-availability.html',
  styleUrl: './venue-availability.css',
})
export class VenueAvailability {
  private readonly venueService = inject(VenueService);

  readonly venues = signal<Venue[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly hasSearched = signal(false);

  eventDate = '';
  startTime = '';
  endTime = '';

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
      this.errorMessage.set(
        'End time must be later than start time.'
      );
      return;
    }

    this.isLoading.set(true);

    this.venueService
      .getAvailableVenues(
        this.eventDate,
        this.startTime,
        this.endTime
      )
      .subscribe({
        next: (response) => {
          this.venues.set(response);
          this.hasSearched.set(true);
          this.isLoading.set(false);
        },

        error: (error) => {
          console.error(
            'Failed to load available venues:',
            error
          );

          this.errorMessage.set(
            error?.error?.message ??
              'Unable to check venue availability. Please try again.'
          );

          this.isLoading.set(false);
        },
      });
  }
}