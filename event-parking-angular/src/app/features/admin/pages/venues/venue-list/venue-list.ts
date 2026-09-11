import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { VenueService } from '../../../../../services/venue';
import { Venue } from '../../../../../models/venue.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-venue-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venue-list.html',
  styleUrl: './venue-list.css',
})
export class VenueList implements OnInit {
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);

  readonly venues = signal<Venue[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadVenues();
  }
  createVenue(): void {
  this.router.navigate(['/admin/venues/new']);
}
editVenue(venueId: number): void {
  this.router.navigate(['/admin/venues', venueId, 'edit']);
}

deleteVenue(venueId: number): void {
  const confirmed = window.confirm(
    'Are you sure you want to delete this venue?'
  );

  if (!confirmed) {
    return;
  }

  this.venueService.deleteVenue(venueId).subscribe({
    next: () => {
      this.venues.update((venues) =>
        venues.filter((venue) => venue.venueId !== venueId)
      );
    },

    error: (error) => {
      console.error('Failed to delete venue:', error);

      this.errorMessage.set(
        error?.error?.message ??
          'Unable to delete venue. Please try again.'
      );
    },
  });
}

  private loadVenues(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.venueService.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load venues:', error);

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load venues. Please try again.'
        );

        this.isLoading.set(false);
      },
    });
  }

  retry(): void {
    this.loadVenues();
  }
}