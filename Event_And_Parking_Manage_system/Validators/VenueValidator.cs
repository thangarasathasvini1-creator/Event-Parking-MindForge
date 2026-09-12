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

            if (dto.CarCapacity < 0 || dto.BikeCapacity < 0 || dto.BusCapacity < 0 || dto.VanCapacity < 0)
                return "Vehicle parking slot capacities cannot be negative.";

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

            if (dto.CarCapacity < 0 || dto.BikeCapacity < 0 || dto.BusCapacity < 0 || dto.VanCapacity < 0)
                return "Vehicle parking slot capacities cannot be negative.";

            return null;
        }
    }
}