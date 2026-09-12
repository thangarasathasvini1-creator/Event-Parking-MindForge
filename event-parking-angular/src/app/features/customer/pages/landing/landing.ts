import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EventService } from '../../../../services/event';
import { Event } from '../../../../models/event.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  readonly featuredEvents = signal<Event[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadFeaturedEvents();
  }

  private loadFeaturedEvents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.featuredEvents.set(events.slice(0, 3));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(
          'Failed to load featured events:',
          error
        );

        this.errorMessage.set(
          'Unable to load featured events.'
        );

        this.isLoading.set(false);
      },
    });
  }

  exploreEvents(): void {
    this.router.navigate(['/events']);
  }

  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  register(): void {
    this.router.navigate(['/register']);
  }
}
