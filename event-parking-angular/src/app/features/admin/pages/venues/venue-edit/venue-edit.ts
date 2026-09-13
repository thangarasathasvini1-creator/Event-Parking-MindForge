import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormRecord, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { VenueService } from '../../../../../services/venue';
import { Venue } from '../../../../../models/venue.model';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-venue-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinner, ErrorMessage],
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

  loadVenue(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.venueService.getVenueById(this.venueId).subscribe({
      next: (response) => {
        this.venue = {
          ...response,
          carCapacity: response.carCapacity ?? 0,
          bikeCapacity: response.bikeCapacity ?? 0,
          busCapacity: response.busCapacity ?? 0,
          vanCapacity: response.vanCapacity ?? 0,
        };
        this.form.patchValue(this.venue, { emitEvent: false });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load venue:', error);

        this.errorMessage.set(
          error?.status === 404
            ? 'Venue not found. It may have been deleted.'
            : (error?.error?.message ?? 'Unable to load venue details.')
        );

        this.isLoading.set(false);
      },
    });
  }

  updateVenue(): void {
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
      venueId: this.venueId,
      name: this.venue.name.trim(),
      address: this.venue.address.trim(),
      totalCapacity: Number(this.venue.totalCapacity),
      totalParkingSlots: totalSlots > 0 ? totalSlots : (this.venue.totalParkingSlots ?? 0),
      carCapacity: Number(this.venue.carCapacity) || 0,
      bikeCapacity: Number(this.venue.bikeCapacity) || 0,
      busCapacity: Number(this.venue.busCapacity) || 0,
      vanCapacity: Number(this.venue.vanCapacity) || 0,
    };

    this.venueService.updateVenue(this.venueId, venueData).subscribe({
      next: () => {
        this.successMessage.set(
          `Venue "${venueData.name}" was updated successfully. Redirecting to venue list...`
        );
        this.isSaving.set(false);

        setTimeout(() => {
          this.goBack();
        }, 1200);
      },
      error: (error) => {
        console.error('Failed to update venue:', error);
        this.errorMessage.set(
          error?.status === 409
            ? 'Cannot modify venue capacity below current active event reservations.'
            : (error?.error?.message ?? 'Unable to update venue. Please try again.')
        );
        this.isSaving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/venues']);
  }
}