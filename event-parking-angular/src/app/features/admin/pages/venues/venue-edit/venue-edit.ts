import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { VenueService } from '../../../../../services/venue';
import { Venue } from '../../../../../models/venue.model';

@Component({
  selector: 'app-venue-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './venue-edit.html',
  styleUrl: './venue-edit.css',
})
export class VenueEdit implements OnInit {
  private readonly venueService = inject(VenueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  venue: Venue = {
    venueId: 0,
    name: '',
    address: '',
    totalCapacity: 0,
  };

  private venueId = 0;

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('venueId')
    );

    if (!id) {
      this.errorMessage.set('Invalid venue ID.');
      this.isLoading.set(false);
      return;
    }

    this.venueId = id;
    this.loadVenue();
  }

  private loadVenue(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.venueService.getVenueById(this.venueId).subscribe({
      next: (response) => {
        this.venue = response;
        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Failed to load venue:', error);

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load venue. Please try again.'
        );

        this.isLoading.set(false);
      },
    });
  }

  updateVenue(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.venue.name.trim()) {
      this.errorMessage.set('Venue name is required.');
      return;
    }

    if (!this.venue.address.trim()) {
      this.errorMessage.set('Venue address is required.');
      return;
    }

    if (this.venue.totalCapacity <= 0) {
      this.errorMessage.set(
        'Total capacity must be greater than 0.'
      );
      return;
    }

    this.isSaving.set(true);

    const venueData: Venue = {
      venueId: this.venueId,
      name: this.venue.name.trim(),
      address: this.venue.address.trim(),
      totalCapacity: this.venue.totalCapacity,
    };

    this.venueService
      .updateVenue(this.venueId, venueData)
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Venue updated successfully.'
          );

          this.isSaving.set(false);
        },

        error: (error) => {
          console.error('Failed to update venue:', error);

          this.errorMessage.set(
            error?.error?.message ??
              'Unable to update venue. Please try again.'
          );

          this.isSaving.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/venues']);
  }
}