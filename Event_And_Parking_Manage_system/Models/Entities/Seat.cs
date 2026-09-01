using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class Seat
    {
        public int SeatId { get; set; }

        public int EventId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public string? Row { get; set; }

        public string? Column { get; set; }

        public SeatStatus Status { get; set; } = SeatStatus.Available;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation Property
        public Event Event { get; set; } = null!;

        //public ICollection<BookingSeat> BookingSeats { get; set; }
        //    = new List<BookingSeat>();
    }
}