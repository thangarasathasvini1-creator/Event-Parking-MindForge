namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class BookingSeat
    {
        public int BookingSeatId { get; set; }

        public int BookingId { get; set; }

        public int SeatId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Booking Booking { get; set; } = null!;

        public Seat Seat { get; set; } = null!;
    }
}