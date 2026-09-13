import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventService } from '../../../../../services/event';
import { Event } from '../../../../../models/event.model';

import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../../shared/components/footer/footer';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, Footer],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  readonly event = signal<Event | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isNotFound = signal(false);

  ngOnInit(): void {
    const eventId = Number(this.route.snapshot.paramMap.get('eventId'));

    if (!eventId || isNaN(eventId)) {
      this.isNotFound.set(true);
      this.errorMessage.set('Event not found. The event ID is missing or invalid.');
      this.isLoading.set(false);
      return;
    }

    this.loadEvent(eventId);
  }

  private loadEvent(eventId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.isNotFound.set(false);

    this.eventService.getEventById(eventId).subscribe({
      next: (response) => {
        this.event.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load event:', error);

        if (error?.status === 404) {
          this.isNotFound.set(true);
          this.errorMessage.set('Event not found. It may have ended or been removed.');
        } else if (error?.status === 409) {
          this.errorMessage.set('Event availability has changed. Please refresh.');
        } else if (error?.status && error.status >= 500) {
          this.errorMessage.set('Unable to load event details right now. Please try again later.');
        } else {
          this.errorMessage.set(
            error?.error?.message ?? 'Unable to load event details. Please try again.'
          );
        }

        this.isLoading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  chooseSeats(): void {
    const currentEvent = this.event();
    if (currentEvent?.eventId) {
      this.router.navigate(['/events', currentEvent.eventId, 'seats']);
    }
  }

  retry(): void {
    const eventId = Number(this.route.snapshot.paramMap.get('eventId'));
    if (eventId) {
      this.loadEvent(eventId);
    } else {
      this.goBack();
    }
  }

  get formattedTime(): string {
    const ev = this.event();
    if (!ev?.startTime) return '';
    const start = ev.startTime.substring(0, 5);
    const end = ev.endTime ? ev.endTime.substring(0, 5) : '';
    return end ? `${start} - ${end}` : start;
  }
}