using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class Booking
    {
        public int BookingId { get; set; }

        public string BookingNumber { get; set; } = string.Empty;

        public int CustomerId { get; set; }

        public int EventId { get; set; }

        public BookingStatus Status { get; set; } = BookingStatus.Pending;

        public decimal TotalAmount { get; set; }

        public DateTime? HoldExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        public Customer Customer { get; set; } = null!;

        public Event Event { get; set; } = null!;

        public ICollection<BookingSeat> BookingSeats { get; set; }
            = new List<BookingSeat>();

        public ParkingReservation? ParkingReservation { get; set; }

        public Payment? Payment { get; set; }
    }
}