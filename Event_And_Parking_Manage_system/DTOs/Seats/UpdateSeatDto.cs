using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.DTOs.Seats
{
    public class UpdateSeatDto
    {
        public string SeatNumber { get; set; } = string.Empty;
        public string? Row { get; set; }
        public string? Column { get; set; }
        public SeatStatus Status { get; set; }
    }
}