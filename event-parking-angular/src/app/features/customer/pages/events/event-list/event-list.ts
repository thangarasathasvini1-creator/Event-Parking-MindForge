import { Component, OnInit, inject, signal } from '@angular/core';

import { EventService } from '../../../../../services/event';
import { Event } from '../../../../../models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList implements OnInit {
  private readonly eventService = inject(EventService);

  readonly events = signal<Event[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

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

  retry(): void {
    this.loadEvents();
  }
}