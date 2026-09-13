import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormRecord, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { VenueService } from '../../../../../services/venue';
import { Venue } from '../../../../../models/venue.model';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-venue-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ErrorMessage],
  templateUrl: './venue-form.html',
  styleUrl: './venue-form.css',
})
export class VenueForm {
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);

  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

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
  readonly form = new FormRecord<FormControl<any>>({
    name: new FormControl(this.venue.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl(this.venue.address ?? '', { nonNullable: true, validators: [Validators.required] }),
    totalCapacity: new FormControl(this.venue.totalCapacity ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    carCapacity: new FormControl(this.venue.carCapacity ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    bikeCapacity: new FormControl(this.venue.bikeCapacity ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    busCapacity: new FormControl(this.venue.busCapacity ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    vanCapacity: new FormControl(this.venue.vanCapacity ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
  });
  constructor() { this.form.valueChanges.subscribe(value => Object.assign(this.venue, value)); }


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

  goBack(): void {
    this.router.navigate(['/admin/venues']);
  }

  saveVenue(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.venue.name || !this.venue.name.trim()) {
      this.errorMessage.set('Venue name is required.');
      return;
    }

    if (!this.venue.address || !this.venue.address.trim()) {
      this.errorMessage.set('Venue address is required.');
      return;
    }

    if (!this.venue.totalCapacity || this.venue.totalCapacity <= 0) {
      this.errorMessage.set('Total capacity must be greater than 0.');
      return;
    }

    if (
      (this.venue.carCapacity ?? 0) < 0 ||
      (this.venue.bikeCapacity ?? 0) < 0 ||
      (this.venue.busCapacity ?? 0) < 0 ||
      (this.venue.vanCapacity ?? 0) < 0
    ) {
      this.errorMessage.set('Vehicle parking capacities cannot be negative.');
      return;
    }

    this.isSaving.set(true);

    const totalSlots = this.computedTotalParkingSlots;

    const venueData: Venue = {
      venueId: 0,
      name: this.venue.name.trim(),
      address: this.venue.address.trim(),
      totalCapacity: Number(this.venue.totalCapacity),
      totalParkingSlots: totalSlots,
      carCapacity: Number(this.venue.carCapacity) || 0,
      bikeCapacity: Number(this.venue.bikeCapacity) || 0,
      busCapacity: Number(this.venue.busCapacity) || 0,
      vanCapacity: Number(this.venue.vanCapacity) || 0,
    };

    this.venueService.createVenue(venueData).subscribe({
      next: () => {
        this.successMessage.set(
          `Venue "${venueData.name}" was created successfully. Redirecting to venue list...`
        );
        this.isSaving.set(false);

        setTimeout(() => {
          this.goBack();
        }, 1200);
      },
      error: (error) => {
        console.error('Failed to create venue:', error);
        this.errorMessage.set(
          error?.error?.message ?? 'Unable to create venue. Please check your data and try again.'
        );
        this.isSaving.set(false);
      },
    });
  }
}