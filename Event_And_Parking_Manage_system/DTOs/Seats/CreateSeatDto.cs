namespace Event_And_Parking_Manage_system.DTOs.Seats
{
    public class CreateSeatDto
    {
        public string SeatNumber { get; set; } = string.Empty;
        public string? Row { get; set; }
        public string? Column { get; set; }
    }
}
