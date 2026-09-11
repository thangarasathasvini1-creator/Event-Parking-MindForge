import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EventService } from '../../../../../services/event';
import { VenueService } from '../../../../../services/venue';
import { CategoryService } from '../../../../../services/category';

import { Event } from '../../../../../models/event.model';
import { Venue } from '../../../../../models/venue.model';
import { Category } from '../../../../../models/category.model';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.css',
})
export class EventForm implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);
  private readonly categoryService = inject(CategoryService);

  readonly venues = signal<Venue[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly isLoading = signal(false);
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

  ngOnInit(): void {
    this.loadVenues();
    this.loadCategories();
  }

  private loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response);
      },
      error: (error) => {
        console.error('Failed to load venues:', error);
        this.errorMessage.set(
          'Unable to load venues. Please try again.'
        );
      },
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response);
      },
      error: (error) => {
        console.error(
          'Failed to load categories:',
          error
        );
        this.errorMessage.set(
          'Unable to load categories. Please try again.'
        );
      },
    });
  }

  saveEvent(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.event.name.trim()) {
      this.errorMessage.set('Event name is required.');
      return;
    }

    if (!this.event.venueId) {
      this.errorMessage.set('Please select a venue.');
      return;
    }

    if (!this.event.categoryId) {
      this.errorMessage.set('Please select a category.');
      return;
    }

    if (!this.event.eventDate) {
      this.errorMessage.set('Event date is required.');
      return;
    }

    if (!this.event.startTime || !this.event.endTime) {
      this.errorMessage.set(
        'Start time and end time are required.'
      );
      return;
    }

    if (this.event.startTime >= this.event.endTime) {
      this.errorMessage.set(
        'End time must be later than start time.'
      );
      return;
    }

    if (this.event.ticketPrice < 0) {
      this.errorMessage.set(
        'Ticket price cannot be negative.'
      );
      return;
    }

    if (this.event.parkingFee < 0) {
      this.errorMessage.set(
        'Parking fee cannot be negative.'
      );
      return;
    }

    if (this.event.capacity <= 0) {
      this.errorMessage.set(
        'Capacity must be greater than 0.'
      );
      return;
    }

    this.isSaving.set(true);

   const eventData: Event = {
  eventId: 0,
  name: this.event.name.trim(),
  venueId: Number(this.event.venueId),
  categoryId: Number(this.event.categoryId),
  eventDate: this.event.eventDate,
  startTime: `${this.event.startTime}:00`,
  endTime: `${this.event.endTime}:00`,
  ticketPrice: Number(this.event.ticketPrice),
  parkingFee: Number(this.event.parkingFee),
  capacity: Number(this.event.capacity),
};

    this.eventService.createEvent(eventData).subscribe({
      next: () => {
        this.successMessage.set(
          'Event created successfully.'
        );

        this.event = {
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

        this.isSaving.set(false);
      },

      error: (error) => {
        console.error(
          'Failed to create event:',
          error
        );

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to create event. Please try again.'
        );

        this.isSaving.set(false);
      },
    });
  }
}