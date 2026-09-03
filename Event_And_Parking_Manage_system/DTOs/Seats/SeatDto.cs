using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.DTOs.Seats
{
    public class SeatDto
    {
        public int SeatId { get; set; }
        public int EventId { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string? Row { get; set; }
        public string? Column { get; set; }
        public SeatStatus Status { get; set; }
    }
}