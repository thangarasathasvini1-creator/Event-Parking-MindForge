import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EventService } from '../../../../../services/event';
import { VenueService } from '../../../../../services/venue';
import { CategoryService } from '../../../../../services/category';

import { Event } from '../../../../../models/event.model';
import { Venue } from '../../../../../models/venue.model';
import { Category } from '../../../../../models/category.model';

@Component({
  selector: 'app-admin-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly events = signal<Event[]>([]);
  readonly venues = signal<Venue[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadEvents();
    this.loadVenues();
    this.loadCategories();
  }

  private loadEvents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.eventService.getEvents().subscribe({
      next: (response) => {
        this.events.set(response);
        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Failed to load events:', error);

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load events. Please try again.'
        );

        this.isLoading.set(false);
      },
    });
  }

  private loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response);
      },

      error: (error) => {
        console.error('Failed to load venues:', error);
      },
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response);
      },

      error: (error) => {
        console.error('Failed to load categories:', error);
      },
    });
  }

  getVenueName(venueId: number): string {
    return (
      this.venues().find(
        (venue) => venue.venueId === venueId
      )?.name ?? `Venue #${venueId}`
    );
  }

  getCategoryName(categoryId: number): string {
    return (
      this.categories().find(
        (category) => category.categoryId === categoryId
      )?.name ?? `Category #${categoryId}`
    );
  }

  createEvent(): void {
    this.router.navigate(['/admin/events/new']);
  }

  editEvent(eventId: number): void {
    this.router.navigate([
      '/admin/events',
      eventId,
      'edit',
    ]);
  }

  deleteEvent(eventId: number): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete this event?'
    );

    if (!confirmed) {
      return;
    }

    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.events.update((events) =>
          events.filter(
            (event) => event.eventId !== eventId
          )
        );
      },

      error: (error) => {
        console.error(
          'Failed to delete event:',
          error
        );

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to delete event. It may have active bookings or dependencies.'
        );
      },
    });
  }

  retry(): void {
    this.loadEvents();
    this.loadVenues();
    this.loadCategories();
  }
}