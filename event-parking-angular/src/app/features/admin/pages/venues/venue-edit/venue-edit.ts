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
    totalParkingSlots: 0,
    carCapacity: 0,
    bikeCapacity: 0,
    busCapacity: 0,
    vanCapacity: 0,
  };

  get computedTotalParkingSlots(): number {
    return (
      (Number(this.venue.carCapacity) || 0) +
      (Number(this.venue.bikeCapacity) || 0) +
      (Number(this.venue.busCapacity) || 0) +
      (Number(this.venue.vanCapacity) || 0)
    );
  }

  updateTotalSlots(): void {
    this.venue.totalParkingSlots = this.computedTotalParkingSlots;
  }

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

    if (
      (this.venue.carCapacity ?? 0) < 0 ||
      (this.venue.bikeCapacity ?? 0) < 0 ||
      (this.venue.busCapacity ?? 0) < 0 ||
      (this.venue.vanCapacity ?? 0) < 0
    ) {
      this.errorMessage.set(
        'Vehicle parking capacities cannot be negative.'
      );
      return;
    }

    this.isSaving.set(true);

    const totalSlots = this.computedTotalParkingSlots;

    const venueData: Venue = {
      venueId: this.venueId,
      name: this.venue.name.trim(),
      address: this.venue.address.trim(),
      totalCapacity: this.venue.totalCapacity,
      totalParkingSlots: totalSlots > 0 ? totalSlots : (this.venue.totalParkingSlots ?? 0),
      carCapacity: Number(this.venue.carCapacity) || 0,
      bikeCapacity: Number(this.venue.bikeCapacity) || 0,
      busCapacity: Number(this.venue.busCapacity) || 0,
      vanCapacity: Number(this.venue.vanCapacity) || 0,
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