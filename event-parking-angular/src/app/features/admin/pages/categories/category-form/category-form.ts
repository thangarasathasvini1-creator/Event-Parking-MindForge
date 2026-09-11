import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CategoryService } from '../../../../../services/category';
import { Category } from '../../../../../models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm {
  private readonly categoryService = inject(CategoryService);

  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  category: Category = {
    categoryId: 0,
    name: '',
    description: '',
  };

  saveCategory(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.category.name.trim()) {
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
          'Category created successfully.'
        );

        this.category = {
          categoryId: 0,
          name: '',
          description: '',
        };

        this.isSaving.set(false);
      },

      error: (error) => {
        console.error(
          'Failed to create category:',
          error
        );

        this.errorMessage.set(
          error?.error?.message ??
            'Unable to create category. Please try again.'
        );

        this.isSaving.set(false);
      },
    });
  }
}