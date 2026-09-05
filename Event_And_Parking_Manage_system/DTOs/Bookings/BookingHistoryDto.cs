namespace Event_And_Parking_Manage_system.DTOs.Bookings
{
    public class BookingHistoryDto
    {
        public int BookingId { get; set; }

        public string BookingNumber { get; set; } = string.Empty;

        public int EventId { get; set; }

        public string EventName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; }

        public int SeatCount { get; set; }

        public int? ParkingSlotId { get; set; }

        public string? PaymentStatus { get; set; }
    }
}
