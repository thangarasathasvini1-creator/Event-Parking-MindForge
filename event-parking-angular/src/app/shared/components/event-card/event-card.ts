import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css',
})
export class EventCard implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  @Input() event!: Event;
  @Output() selectEvent = new EventEmitter<number>();

  imageLoadError = false;
  readonly isBookingClosed = signal<boolean>(false);
  readonly countdownText = signal<string>('');
  readonly isClosingSoon = signal<boolean>(false);

  private timerInterval: any = null;

  ngOnInit(): void {
    this.initCountdownTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  onImageError(): void {
    this.imageLoadError = true;
  }

  onSelect(): void {
    if (this.event?.eventId) {
      this.selectEvent.emit(this.event.eventId);
      this.router.navigate(['/events', this.event.eventId]);
    }
  }

  onKeyDown(keyboardEvent: KeyboardEvent): void {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      this.onSelect();
    }
  }

  get eventDate(): Date | null {
    return this.event?.eventDate ? new Date(this.event.eventDate) : null;
  }

  get formattedTime(): string {
    if (!this.event?.startTime) {
      return '';
    }
    const start = this.event.startTime.substring(0, 5);
    const end = this.event.endTime ? this.event.endTime.substring(0, 5) : '';
    return end ? `${start} - ${end}` : start;
  }

  get hasParking(): boolean {
    return (
      (this.event?.parkingFee !== undefined && this.event.parkingFee > 0) ||
      Boolean(this.event?.parkingAvailable)
    );
  }

  private initCountdownTimer(): void {
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
    if (this.event?.bookingClosesAt) {
      const parsed = new Date(this.event.bookingClosesAt);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if (this.event?.eventDate) {
      const datePart = this.event.eventDate.substring(0, 10);
      const timePart = this.event.startTime ? this.event.startTime.substring(0, 8) : '00:00:00';
      const parsed = new Date(`${datePart}T${timePart}`);
      if (!isNaN(parsed.getTime())) return parsed;
      return new Date(this.event.eventDate);
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
}

