import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EventService } from '../../../../services/event';
import { Event } from '../../../../models/event.model';
import { AuthStateService } from '../../../../core/auth/auth-state';

import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';
import { EventCard } from '../../../../shared/components/event-card/event-card';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Navbar,
    Footer,
    EventCard,
    LoadingSpinner,
    ErrorMessage
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly featuredEvents = signal<Event[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly searchQuery = signal('');

  readonly categories = [
    { name: 'Concerts & Music', icon: '🎵', slug: 'music' },
    { name: 'Sports & Games', icon: '⚽', slug: 'sports' },
    { name: 'Theatre & Arts', icon: '🎭', slug: 'theatre' },
    { name: 'Conferences & Tech', icon: '💼', slug: 'conference' },
    { name: 'Festivals & Food', icon: '🎪', slug: 'festival' },
  ];

  ngOnInit(): void {
    const user = this.authState.getUser();
    const role = user?.role?.toLowerCase();
    if (this.authState.isAuthenticated() && (role === 'admin' || role === 'administrator')) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

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

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/events'], { queryParams: { name: query } });
    } else {
      this.router.navigate(['/events']);
    }
  }

  filterByCategory(categoryName: string): void {
    this.router.navigate(['/events'], { queryParams: { category: categoryName } });
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
