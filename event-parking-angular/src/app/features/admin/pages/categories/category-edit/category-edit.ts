import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CategoryService } from '../../../../../services/category';
import { Category } from '../../../../../models/category.model';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner, ErrorMessage],
  templateUrl: './category-edit.html',
  styleUrl: './category-edit.css',
})
export class CategoryEdit implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  category: Category = {
    categoryId: 0,
    name: '',
    description: '',
  };

  private categoryId = 0;

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('categoryId')
    );

    if (!id) {
      this.errorMessage.set('Invalid category ID.');
      this.isLoading.set(false);
      return;
    }

    this.categoryId = id;
    this.loadCategory();
  }

  loadCategory(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.categoryService
      .getCategoryById(this.categoryId)
      .subscribe({
        next: (response) => {
          this.category = {
            categoryId: response.categoryId,
            name: response.name,
            description: response.description ?? '',
          };
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load category:', error);
          this.errorMessage.set(
            error?.status === 404
              ? 'Category not found. It may have been deleted.'
              : (error?.error?.message ?? 'Unable to load category details.')
          );
          this.isLoading.set(false);
        },
      });
  }

  updateCategory(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.category.name || !this.category.name.trim()) {
      this.errorMessage.set('Category name is required.');
      return;
    }

    this.isSaving.set(true);

    const categoryData: Category = {
      categoryId: this.categoryId,
      name: this.category.name.trim(),
      description: this.category.description?.trim() || '',
    };

    this.categoryService
      .updateCategory(this.categoryId, categoryData)
      .subscribe({
        next: () => {
          this.successMessage.set(
            `Category "${categoryData.name}" was updated successfully. Redirecting to categories...`
          );
          this.isSaving.set(false);

          setTimeout(() => {
            this.goBack();
          }, 1200);
        },
        error: (error) => {
          console.error('Failed to update category:', error);
          this.errorMessage.set(
            error?.error?.message ??
              'Unable to update category. Please check your data and try again.'
          );
          this.isSaving.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/categories']);
  }
}