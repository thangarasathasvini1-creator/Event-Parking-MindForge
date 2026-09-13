import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
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
export class EventCard {
  private readonly router = inject(Router);

  @Input() event!: Event;
  @Output() selectEvent = new EventEmitter<number>();

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
}

