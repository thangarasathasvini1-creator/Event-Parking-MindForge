import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EventService } from '../../../../../services/event';
import { Event } from '../../../../../models/event.model';

@Component({
  selector: 'app-event-details',
  standalone: true,
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);

  readonly event = signal<Event | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    const eventId = Number(this.route.snapshot.paramMap.get('eventId'));

    if (!eventId) {
      this.errorMessage.set('Invalid event ID.');
      this.isLoading.set(false);
      return;
    }

    this.loadEvent(eventId);
  }

  private loadEvent(eventId: number): void {
    this.eventService.getEventById(eventId).subscribe({
      next: (response) => {
        this.event.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load event:', error);

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load event details. Please try again.'
        );

        this.isLoading.set(false);
      },
    });
  }

  retry(): void {
    const eventId = Number(this.route.snapshot.paramMap.get('eventId'));

    if (eventId) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.loadEvent(eventId);
    }
  }
}