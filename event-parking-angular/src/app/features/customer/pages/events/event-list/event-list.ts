import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EventService } from '../../../../../services/event';
import { Event } from '../../../../../models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  readonly events = signal<Event[]>([]);
  readonly searchTerm = signal('');

  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly filteredEvents = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.events();
    }

    return this.events().filter((event) =>
      event.name.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.loadEvents();
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

  onSearch(event: globalThis.Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  retry(): void {
    this.loadEvents();
  }
}