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
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-event-list',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmationDialog,
    LoadingSpinner,
    ErrorMessage,
    EmptyState,
  ],
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
  readonly successMessage = signal('');

  readonly pendingEventToDelete = signal<Event | null>(null);
  readonly showDeleteModal = signal(false);
  readonly isDeleting = signal(false);

  ngOnInit(): void {
    this.loadEvents();
    this.loadVenues();
    this.loadCategories();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.eventService.getEvents().subscribe({
      next: (response) => {
        this.events.set(response ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load events:', error);
        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load events. Please check your connection and try again.'
        );
        this.isLoading.set(false);
      },
    });
  }

  loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response ?? []);
      },
      error: (error) => {
        console.error('Failed to load venues:', error);
      },
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response ?? []);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      },
    });
  }

  getVenueName(venueId: number): string {
    return (
      this.venues().find((venue) => venue.venueId === venueId)?.name ??
      `Venue #${venueId}`
    );
  }

  getCategoryName(categoryId: number): string {
    return (
      this.categories().find((category) => category.categoryId === categoryId)
        ?.name ?? `Category #${categoryId}`
    );
  }

  createEvent(): void {
    this.router.navigate(['/admin/events/new']);
  }

  editEvent(eventId: number): void {
    this.router.navigate(['/admin/events', eventId, 'edit']);
  }

  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  initiateDelete(event: Event): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingEventToDelete.set(event);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.pendingEventToDelete.set(null);
    this.showDeleteModal.set(false);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const event = this.pendingEventToDelete();
    if (!event?.eventId) {
      this.cancelDelete();
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.eventService.deleteEvent(event.eventId).subscribe({
      next: () => {
        this.events.update((events) =>
          events.filter((e) => e.eventId !== event.eventId)
        );
        this.successMessage.set(
          `Event "${event.name}" was deleted successfully.`
        );
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Failed to delete event:', error);
        this.isDeleting.set(false);

        if (error?.status === 409) {
          this.errorMessage.set(
            `Unable to delete "${event.name}" because active customer bookings or seat reservations already exist for this event.`
          );
        } else {
          this.errorMessage.set(
            error?.error?.message ??
              `Unable to delete "${event.name}". It may have dependent records or bookings.`
          );
        }

        this.showDeleteModal.set(false);
      },
    });
  }

  retry(): void {
    this.loadEvents();
    this.loadVenues();
    this.loadCategories();
  }
}