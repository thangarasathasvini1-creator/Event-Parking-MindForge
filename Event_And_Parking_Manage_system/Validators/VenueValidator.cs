using Event_And_Parking_Manage_system.DTOs.Venues;

namespace Event_And_Parking_Manage_system.Validators
{
    public class VenueValidator
    {
        public static string? Validate(CreateVenueDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Venue name is required.";

            if (string.IsNullOrWhiteSpace(dto.Address))
                return "Venue address is required.";

            if (dto.TotalCapacity <= 0)
                return "Venue capacity must be greater than zero.";

            return null;
        }

        public static string? Validate(UpdateVenueDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Venue name is required.";

            if (string.IsNullOrWhiteSpace(dto.Address))
                return "Venue address is required.";

            if (dto.TotalCapacity <= 0)
                return "Venue capacity must be greater than zero.";

            return null;
        }
    }
}