import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, LoadingSpinner, ErrorMessage],
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
  };

  /** Selected venue computed based on current event.venueId */
  readonly selectedVenue = computed(() => {
    const venueId = Number(this.event.venueId);
    return this.venues().find((v) => v.venueId === venueId) ?? null;
  });

  /** Max venue capacity for immediate validation */
  readonly selectedVenueCapacity = computed(() => {
    return this.selectedVenue()?.totalCapacity ?? 0;
  });

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
        };

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
      ticketPrice: Number(this.event.ticketPrice),
      parkingFee: Number(this.event.parkingFee),
      capacity: Number(this.event.capacity),
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