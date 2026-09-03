using Event_And_Parking_Manage_system.DTOs.Categories;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Event_And_Parking_Manage_system.Validators;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();

            return categories.Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description
            });
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);

            if (category == null)
                return null;

            return new CategoryDto
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                Description = category.Description
            };
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            var validationError = CategoryValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            var existingCategory =
                await _categoryRepository.GetByNameAsync(dto.Name);

            if (existingCategory != null)
                throw new InvalidOperationException(
                    "Category name already exists.");

            var category = new EventCategory
            {
                Name = dto.Name,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _categoryRepository.AddAsync(category);
            await _categoryRepository.SaveChangesAsync();

            return new CategoryDto
            {
                CategoryId = category.CategoryId,
                Name = category.Name,
                Description = category.Description
            };
        }

        public async Task<bool> UpdateAsync(
            int id,
            UpdateCategoryDto dto)
        {
            var validationError = CategoryValidator.Validate(dto);

            if (validationError != null)
                throw new ArgumentException(validationError);

            var category =
                await _categoryRepository.GetByIdAsync(id);

            if (category == null)
                return false;

            var existingCategory =
                await _categoryRepository.GetByNameAsync(dto.Name);

            if (existingCategory != null &&
                existingCategory.CategoryId != id)
            {
                throw new InvalidOperationException(
                    "Category name already exists.");
            }

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.UpdatedAt = DateTime.UtcNow;

            _categoryRepository.Update(category);

            return await _categoryRepository.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category =
                await _categoryRepository.GetByIdAsync(id);

            if (category == null)
                return false;

            _categoryRepository.Delete(category);

            return await _categoryRepository.SaveChangesAsync();
        }
    }
}