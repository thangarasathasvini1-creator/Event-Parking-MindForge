namespace Event_And_Parking_Manage_system.DTOs.Bookings
{
    public class BookingDto
    {
        public int BookingId { get; set; }

        public string BookingNumber { get; set; } = string.Empty;

        public int CustomerId { get; set; }

        public int EventId { get; set; }

        public string Status { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public DateTime? HoldExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public List<int> SeatIds { get; set; } = new();

        public int? ParkingSlotId { get; set; }

        public string? PaymentStatus { get; set; }
    }
}
