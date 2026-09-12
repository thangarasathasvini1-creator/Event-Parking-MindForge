import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EventService } from '../../../../../services/event';
import { CategoryService } from '../../../../../services/category';

import { Event } from '../../../../../models/event.model';
import { Category } from '../../../../../models/category.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly events = signal<Event[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly searchTerm = signal('');
  readonly selectedCategoryId = signal<number | null>(null);

  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly filteredEvents = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const categoryId = this.selectedCategoryId();

    return this.events().filter((event) => {
      const matchesSearch =
        !search ||
        event.name.toLowerCase().includes(search);

      const matchesCategory =
        categoryId === null ||
       event.categoryId === categoryId;

      return matchesSearch && matchesCategory;
    });
  });

  ngOnInit(): void {
    this.loadEvents();
    this.loadCategories();
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

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response);
      },

      error: (error) => {
        console.error('Failed to load categories:', error);
      },
    });
  }

  onSearch(event: globalThis.Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onCategoryChange(event: globalThis.Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    this.selectedCategoryId.set(
      value ? Number(value) : null
    );
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategoryId.set(null);
  }

  viewEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  retry(): void {
    this.loadEvents();
    this.loadCategories();
  }
}