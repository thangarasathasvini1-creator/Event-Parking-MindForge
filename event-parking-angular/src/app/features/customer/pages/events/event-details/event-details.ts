import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventService } from '../../../../../services/event';
import { Event } from '../../../../../models/event.model';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  readonly event = signal<Event | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isNotFound = signal(false);

  readonly isBookingClosed = signal<boolean>(false);
  readonly countdownText = signal<string>('');
  readonly isClosingSoon = signal<boolean>(false);

  private timerInterval: any = null;

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

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private loadEvent(eventId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.isNotFound.set(false);

    this.eventService.getEventById(eventId).subscribe({
      next: (response) => {
        this.event.set(response);
        this.isLoading.set(false);
        this.initCountdownTimer();
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

  private initCountdownTimer(): void {
    this.clearTimer();
    this.updateCountdown();
    this.timerInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private getBookingDeadline(): Date | null {
    const ev = this.event();
    if (ev?.bookingClosesAt) {
      const parsed = new Date(ev.bookingClosesAt);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if (ev?.eventDate) {
      const datePart = ev.eventDate.substring(0, 10);
      const timePart = ev.startTime ? ev.startTime.substring(0, 8) : '00:00:00';
      const parsed = new Date(`${datePart}T${timePart}`);
      if (!isNaN(parsed.getTime())) return parsed;
      return new Date(ev.eventDate);
    }
    return null;
  }

  private updateCountdown(): void {
    const deadline = this.getBookingDeadline();
    if (!deadline) {
      this.isBookingClosed.set(false);
      this.countdownText.set('');
      return;
    }

    const now = Date.now();
    const diffMs = deadline.getTime() - now;

    if (diffMs <= 0) {
      this.isBookingClosed.set(true);
      this.countdownText.set('Closed');
      this.isClosingSoon.set(false);
      this.clearTimer();
      return;
    }

    this.isBookingClosed.set(false);
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.isClosingSoon.set(days === 0 && hours < 24);

    if (days > 0) {
      this.countdownText.set(`${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`);
    } else if (hours > 0) {
      this.countdownText.set(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
    } else {
      this.countdownText.set(`${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
    }
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  chooseSeats(): void {
    if (this.isBookingClosed()) {
      return;
    }
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