import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CategoryService } from '../../../../../services/category';
import { Category } from '../../../../../models/category.model';
import { ErrorMessage } from '../../../../../shared/components/error-message/error-message';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ErrorMessage],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  category: Category = {
    categoryId: 0,
    name: '',
    description: '',
  };

  goBack(): void {
    this.router.navigate(['/admin/categories']);
  }

  saveCategory(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.category.name || !this.category.name.trim()) {
      this.errorMessage.set('Category name is required.');
      return;
    }

    this.isSaving.set(true);

    const categoryData: Category = {
      categoryId: 0,
      name: this.category.name.trim(),
      description: this.category.description?.trim() || '',
    };

    this.categoryService.createCategory(categoryData).subscribe({
      next: () => {
        this.successMessage.set(
          `Category "${categoryData.name}" was created successfully. Redirecting to categories...`
        );
        this.isSaving.set(false);

        setTimeout(() => {
          this.goBack();
        }, 1200);
      },
      error: (error) => {
        console.error('Failed to create category:', error);
        this.errorMessage.set(
          error?.status === 409
            ? 'A category with this name already exists.'
            : (error?.error?.message ?? 'Unable to create category. Please check your data and try again.')
        );
        this.isSaving.set(false);
      },
    });
  }
}