import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CategoryService } from '../../../../../services/category';
import { Category } from '../../../../../models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response);
        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Failed to load categories:', error);

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load categories. Please try again.'
        );

        this.isLoading.set(false);
      },
    });
  }

  createCategory(): void {
    this.router.navigate(['/admin/categories/new']);
  }

  editCategory(categoryId: number): void {
    this.router.navigate([
      '/admin/categories',
      categoryId,
      'edit',
    ]);
  }

  retry(): void {
    this.loadCategories();
  }
}