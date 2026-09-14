import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormRecord, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { EventService } from '../../../../../services/event';
import { VenueService } from '../../../../../services/venue';
import { CategoryService } from '../../../../../services/category';

import { Event } from '../../../../../models/event.model';
import { Venue } from '../../../../../models/venue.model';
import { Category } from '../../../../../models/category.model';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinner, ErrorMessage],
  templateUrl: './event-edit.html',
  styleUrl: './event-edit.css',
})
export class EventEdit implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly venues = signal<Venue[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);

  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  event: Event = {
    eventId: 0,
    name: '',
    venueId: 0,
    categoryId: 0,
    eventDate: '',
    startTime: '',
    endTime: '',
    ticketPrice: 0,
    parkingFee: 0,
    capacity: 0,
    imageUrl: '',
    bookingClosesAt: '',
  };
  readonly form = new FormRecord<FormControl<any>>({
    name: new FormControl(this.event.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    categoryId: new FormControl(this.event.categoryId ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    venueId: new FormControl(this.event.venueId ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    eventDate: new FormControl(this.event.eventDate ?? '', { nonNullable: true, validators: [Validators.required] }),
    startTime: new FormControl(this.event.startTime ?? '', { nonNullable: true, validators: [Validators.required] }),
    endTime: new FormControl(this.event.endTime ?? '', { nonNullable: true, validators: [Validators.required] }),
    bookingClosesAt: new FormControl(this.event.bookingClosesAt ?? '', { nonNullable: true }),
    ticketPrice: new FormControl(this.event.ticketPrice ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    parkingFee: new FormControl(this.event.parkingFee ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    capacity: new FormControl(this.event.capacity ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    imageUrl: new FormControl(this.event.imageUrl ?? '', { nonNullable: true }),
  });
  constructor() { this.form.valueChanges.subscribe(value => Object.assign(this.event, value)); }

  setBookingClosesPreset(preset: 'start' | '1h' | '2h' | '24h' | 'clear'): void {
    if (preset === 'clear') {
      this.form.controls['bookingClosesAt'].setValue('');
      return;
    }
    if (!this.event.eventDate || !this.event.startTime) {
      return;
    }
    const [year, month, day] = this.event.eventDate.split('T')[0].split('-').map(Number);
    const [hours, minutes] = this.event.startTime.split(':').map(Number);
    const eventStartDate = new Date(year, month - 1, day, hours, minutes);

    let targetDate: Date;
    switch (preset) {
      case 'start':
        targetDate = new Date(eventStartDate);
        break;
      case '1h':
        targetDate = new Date(eventStartDate.getTime() - 60 * 60 * 1000);
        break;
      case '2h':
        targetDate = new Date(eventStartDate.getTime() - 2 * 60 * 60 * 1000);
        break;
      case '24h':
        targetDate = new Date(eventStartDate.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;
    this.form.controls['bookingClosesAt'].setValue(localIso);
  }

  private formatDateTimeLocal(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  readonly imagePresets = [
    { label: 'Music Concert', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80' },
    { label: 'Sports Match', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80' },
    { label: 'Tech Conference', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80' },
    { label: 'Theatre & Drama', url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80' },
    { label: 'Gala Dinner', url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80' },
    { label: 'Art Exhibition', url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&auto=format&fit=crop&q=80' },
  ];

  selectImagePreset(url: string): void {
    this.form.controls['imageUrl'].setValue(url);
    this.event.imageUrl = url;
  }

  clearImage(): void {
    this.form.controls['imageUrl'].setValue('');
    this.event.imageUrl = '';
  }


  /** Selected venue computed based on current event.venueId */
  readonly selectedVenue = () => {
    const venueId = Number(this.event.venueId);
    return this.venues().find((v) => v.venueId === venueId) ?? null;
  };

  /** Selected category computed based on current event.categoryId */
  readonly selectedCategory = () => {
    const categoryId = Number(this.event.categoryId);
    return this.categories().find((c) => c.categoryId === categoryId) ?? null;
  };

  /** Max venue capacity for immediate validation */
  readonly selectedVenueCapacity = () => {
    return this.selectedVenue()?.totalCapacity ?? 0;
  };

  /** Immediate capacity validation warning */
  get isCapacityExceeded(): boolean {
    const max = this.selectedVenueCapacity();
    return max > 0 && Number(this.event.capacity) > max;
  }

  ngOnInit(): void {
    const eventId = Number(
      this.route.snapshot.paramMap.get('eventId')
    );

    if (!eventId) {
      this.errorMessage.set('Invalid event ID.');
      this.isLoading.set(false);
      return;
    }

    this.loadVenues();
    this.loadCategories();
    this.loadEvent(eventId);
  }

  private loadEvent(eventId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.eventService.getEventById(eventId).subscribe({
      next: (response) => {
        this.event = {
          eventId: response.eventId,
          name: response.name,
          venueId: response.venueId,
          categoryId: response.categoryId,
          eventDate: response.eventDate
            ? response.eventDate.substring(0, 10)
            : '',
          startTime: this.formatTime(response.startTime),
          endTime: this.formatTime(response.endTime),
          ticketPrice: response.ticketPrice,
          parkingFee: response.parkingFee,
          capacity: response.capacity,
          imageUrl: response.imageUrl ?? '',
          bookingClosesAt: response.bookingClosesAt
            ? this.formatDateTimeLocal(response.bookingClosesAt)
            : '',
        };
        this.form.patchValue(this.event, { emitEvent: false });

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load event:', error);

        this.errorMessage.set(
          error?.status === 404
            ? 'Event not found. It may have been deleted.'
            : (error?.error?.message ?? 'Unable to load event. Please try again.')
        );

        this.isLoading.set(false);
      },
    });
  }

  private loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response ?? []);
      },
      error: (error) => {
        console.error('Failed to load venues:', error);
      },
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response ?? []);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      },
    });
  }

  private formatTime(time: string): string {
    if (!time) {
      return '';
    }
    return time.substring(0, 5);
  }

  onVenueChange(): void {
    const max = this.selectedVenueCapacity();
    if (max > 0 && (!this.event.capacity || this.event.capacity > max)) {
      this.event.capacity = max;
      this.form.controls['capacity'].setValue(max);
    }
  }

  updateEvent(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.event.name || !this.event.name.trim()) {
      this.errorMessage.set('Event name is required.');
      return;
    }

    if (!this.event.venueId || Number(this.event.venueId) <= 0) {
      this.errorMessage.set('Please select a venue.');
      return;
    }

    if (!this.event.categoryId || Number(this.event.categoryId) <= 0) {
      this.errorMessage.set('Please select a category.');
      return;
    }

    if (!this.event.eventDate) {
      this.errorMessage.set('Event date is required.');
      return;
    }

    if (!this.event.startTime || !this.event.endTime) {
      this.errorMessage.set('Start time and end time are required.');
      return;
    }

    if (this.event.startTime >= this.event.endTime) {
      this.errorMessage.set('Start time must be earlier than end time.');
      return;
    }

    if (this.isCapacityExceeded) {
      this.errorMessage.set(
        `Event capacity (${this.event.capacity}) cannot exceed venue total capacity (${this.selectedVenueCapacity()}).`
      );
      return;
    }

    if (!this.event.capacity || Number(this.event.capacity) <= 0) {
      this.errorMessage.set('Capacity must be greater than 0.');
      return;
    }

    if (Number(this.event.ticketPrice) < 0) {
      this.errorMessage.set('Ticket price cannot be negative.');
      return;
    }

    if (Number(this.event.parkingFee) < 0) {
      this.errorMessage.set('Parking fee cannot be negative.');
      return;
    }

    this.isSaving.set(true);

    const formattedStart =
      this.event.startTime.length === 5
        ? `${this.event.startTime}:00`
        : this.event.startTime;
    const formattedEnd =
      this.event.endTime.length === 5
        ? `${this.event.endTime}:00`
        : this.event.endTime;

    const eventData: Event = {
      eventId: this.event.eventId,
      name: this.event.name.trim(),
      venueId: Number(this.event.venueId),
      categoryId: Number(this.event.categoryId),
      eventDate: this.event.eventDate,
      startTime: formattedStart,
      endTime: formattedEnd,
      bookingClosesAt: this.event.bookingClosesAt
        ? new Date(this.event.bookingClosesAt).toISOString()
        : undefined,
      ticketPrice: Number(this.event.ticketPrice),
      parkingFee: Number(this.event.parkingFee),
      capacity: Number(this.event.capacity),
      imageUrl: this.event.imageUrl?.trim() || undefined,
    };

    this.eventService
      .updateEvent(this.event.eventId, eventData)
      .subscribe({
        next: () => {
          this.successMessage.set(
            `Event "${eventData.name}" was updated successfully. Redirecting to events...`
          );
          this.isSaving.set(false);

          setTimeout(() => {
            this.backToEvents();
          }, 1200);
        },
        error: (error) => {
          console.error('Failed to update event:', error);

          if (error?.status === 409) {
            this.errorMessage.set(
              'Unable to complete this operation because the venue or event schedule conflicts with an existing reservation, or active bookings restrict these modifications.'
            );
          } else {
            this.errorMessage.set(
              error?.error?.message ??
                'Unable to update event. Please verify all inputs and try again.'
            );
          }

          this.isSaving.set(false);
        },
      });
  }

  backToEvents(): void {
    this.router.navigate(['/admin/events']);
  }
}