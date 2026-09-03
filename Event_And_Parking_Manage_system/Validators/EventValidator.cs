using Event_And_Parking_Manage_system.DTOs.Events;

namespace Event_And_Parking_Manage_system.Validators
{
    public class EventValidator
    {
        public static string? Validate(CreateEventDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Event name is required.";

            if (dto.VenueId <= 0)
                return "Valid venue is required.";

            if (dto.CategoryId <= 0)
                return "Valid category is required.";

            if (dto.Capacity <= 0)
                return "Event capacity must be greater than zero.";

            if (dto.StartTime >= dto.EndTime)
                return "Start time must be earlier than end time.";

            if (dto.TicketPrice < 0)
                return "Ticket price cannot be negative.";

            if (dto.ParkingFee < 0)
                return "Parking fee cannot be negative.";

            return null;
        }

        public static string? Validate(UpdateEventDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Event name is required.";

            if (dto.VenueId <= 0)
                return "Valid venue is required.";

            if (dto.CategoryId <= 0)
                return "Valid category is required.";

            if (dto.Capacity <= 0)
                return "Event capacity must be greater than zero.";

            if (dto.StartTime >= dto.EndTime)
                return "Start time must be earlier than end time.";

            if (dto.TicketPrice < 0)
                return "Ticket price cannot be negative.";

            if (dto.ParkingFee < 0)
                return "Parking fee cannot be negative.";

            return null;
        }
    }
}