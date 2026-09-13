import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { EventService, EventFilterParams } from '../../../../../services/event';
import { CategoryService } from '../../../../../services/category';
import { VenueService } from '../../../../../services/venue';

import { Event } from '../../../../../models/event.model';
import { Category } from '../../../../../models/category.model';
import { Venue } from '../../../../../models/venue.model';

import { Navbar } from '../../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../../shared/components/footer/footer';
import { EventCard } from '../../../../../shared/components/event-card/event-card';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';
import { Pagination } from '../../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Navbar,
    Footer,
    EventCard,
    EmptyState,
    ErrorMessage,
    Pagination,
  ],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);
  private readonly categoryService = inject(CategoryService);
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** When embedded inside dashboard, navbar and footer can be suppressed */
  @Input() isEmbedded = false;

  readonly events = signal<Event[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly venues = signal<Venue[]>([]);

  readonly searchTerm = signal('');
  readonly selectedCategoryId = signal<number | null>(null);
  readonly selectedVenueId = signal<number | null>(null);
  readonly selectedDate = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(6);

  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly Math = Math;

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private queryParamSubscription?: Subscription;

  readonly hasActiveFilters = computed(() => {
    return Boolean(
      this.searchTerm().trim() ||
        this.selectedCategoryId() !== null ||
        this.selectedVenueId() !== null ||
        this.selectedDate()
    );
  });

  readonly paginatedEvents = computed(() => {
    const all = this.events();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return all.slice(start, start + size);
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadVenues();

    // Setup debounced search handler
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.syncUrlAndFetch();
      });

    // Listen to query parameters from URL
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      const name = params['name'] || params['search'] || '';
      const categoryId = params['categoryId']
        ? Number(params['categoryId'])
        : null;
      const venueId = params['venueId'] ? Number(params['venueId']) : null;
      const date = params['eventDate'] || params['date'] || '';
      const page = params['page'] ? Math.max(1, Number(params['page'])) : 1;

      this.searchTerm.set(name);
      this.selectedCategoryId.set(categoryId);
      this.selectedVenueId.set(venueId);
      this.selectedDate.set(date);
      this.currentPage.set(page);

      this.fetchEvents();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.queryParamSubscription?.unsubscribe();
  }

  fetchEvents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const filter: EventFilterParams = {};
    if (this.searchTerm().trim()) {
      filter.name = this.searchTerm().trim();
    }
    if (this.selectedCategoryId() !== null) {
      filter.categoryId = this.selectedCategoryId()!;
    }
    if (this.selectedVenueId() !== null) {
      filter.venueId = this.selectedVenueId()!;
    }
    if (this.selectedDate().trim()) {
      filter.eventDate = this.selectedDate().trim();
    }

    this.eventService.getEvents(filter).subscribe({
      next: (response) => {
        this.events.set(response ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load events:', error);
        this.handleLoadError(error);
        this.isLoading.set(false);
      },
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response ?? []);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      },
    });
  }

  private loadVenues(): void {
    this.venueService.getVenues().subscribe({
      next: (response) => {
        this.venues.set(response ?? []);
      },
      error: (error) => {
        console.error('Failed to load venues:', error);
      },
    });
  }

  onSearchInput(event: globalThis.Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onCategoryChange(event: globalThis.Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value ? Number(select.value) : null;
    this.selectedCategoryId.set(value);
    this.currentPage.set(1);
    this.syncUrlAndFetch();
  }

  onVenueChange(event: globalThis.Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value ? Number(select.value) : null;
    this.selectedVenueId.set(value);
    this.currentPage.set(1);
    this.syncUrlAndFetch();
  }

  onDateChange(event: globalThis.Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(input.value || '');
    this.currentPage.set(1);
    this.syncUrlAndFetch();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.syncUrlAndFetch();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategoryId.set(null);
    this.selectedVenueId.set(null);
    this.selectedDate.set('');
    this.currentPage.set(1);
    this.syncUrlAndFetch();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.syncUrlAndFetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  retry(): void {
    this.fetchEvents();
    this.loadCategories();
    this.loadVenues();
  }

  private syncUrlAndFetch(): void {
    if (this.isEmbedded) {
      this.fetchEvents();
      return;
    }

    const queryParams: Record<string, string | number | null> = {};

    if (this.searchTerm().trim()) {
      queryParams['name'] = this.searchTerm().trim();
    }
    if (this.selectedCategoryId() !== null) {
      queryParams['categoryId'] = this.selectedCategoryId();
    }
    if (this.selectedVenueId() !== null) {
      queryParams['venueId'] = this.selectedVenueId();
    }
    if (this.selectedDate().trim()) {
      queryParams['eventDate'] = this.selectedDate().trim();
    }
    if (this.currentPage() > 1) {
      queryParams['page'] = this.currentPage();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  private handleLoadError(error: unknown): void {
    const httpError = error as { status?: number; error?: { message?: string } };
    if (httpError.status === 404) {
      this.errorMessage.set('No events found matching your criteria.');
    } else if (httpError.status && httpError.status >= 500) {
      this.errorMessage.set('Unable to load events right now. Our servers may be busy.');
    } else {
      this.errorMessage.set(
        httpError.error?.message ?? 'Unable to load events. Please try again.'
      );
    }
  }
}