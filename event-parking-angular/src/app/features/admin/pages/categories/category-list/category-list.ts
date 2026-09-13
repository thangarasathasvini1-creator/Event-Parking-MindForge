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
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmationDialog,
    LoadingSpinner,
    ErrorMessage,
    EmptyState,
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly pendingCategoryToDelete = signal<Category | null>(null);
  readonly showDeleteModal = signal(false);
  readonly isDeleting = signal(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
        this.errorMessage.set(
          error?.error?.message ??
            'Unable to load categories. Please check your network connection and try again.'
        );
        this.isLoading.set(false);
      },
    });
  }

  createCategory(): void {
    this.router.navigate(['/admin/categories/new']);
  }

  editCategory(categoryId: number): void {
    this.router.navigate(['/admin/categories', categoryId, 'edit']);
  }

  initiateDelete(category: Category): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.pendingCategoryToDelete.set(category);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.pendingCategoryToDelete.set(null);
    this.showDeleteModal.set(false);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const category = this.pendingCategoryToDelete();
    if (!category?.categoryId) {
      this.cancelDelete();
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.categoryService.deleteCategory(category.categoryId).subscribe({
      next: () => {
        this.categories.update((items) =>
          items.filter((c) => c.categoryId !== category.categoryId)
        );
        this.successMessage.set(
          `Category "${category.name}" was deleted successfully.`
        );
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Failed to delete category:', error);
        this.isDeleting.set(false);

        if (error?.status === 409) {
          this.errorMessage.set(
            'This category cannot be deleted because it is currently assigned to existing events.'
          );
        } else {
          this.errorMessage.set(
            error?.error?.message ??
              `Unable to delete category "${category.name}". It may be referenced by existing events.`
          );
        }

        this.showDeleteModal.set(false);
      },
    });
  }

  retry(): void {
    this.loadCategories();
  }
}