using Event_And_Parking_Manage_system.DTOs.Categories;

namespace Event_And_Parking_Manage_system.Validators
{
    public class CategoryValidator
    {
        public static string? Validate(CreateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Category name is required.";

            return null;
        }

        public static string? Validate(UpdateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Category name is required.";

            return null;
        }
    }
}