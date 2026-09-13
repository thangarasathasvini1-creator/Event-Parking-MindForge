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

  get eventDate(): Date | null {
    return this.event?.eventDate ? new Date(this.event.eventDate) : null;
  }
}

