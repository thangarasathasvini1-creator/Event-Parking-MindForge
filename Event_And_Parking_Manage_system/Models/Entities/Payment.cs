using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public int BookingId { get; set; }

        public decimal Amount { get; set; }

        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public string? PaymentMethod { get; set; }

        public string? TransactionReference { get; set; }

        public DateTime? PaidAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property
        public Booking Booking { get; set; } = null!;
    }
}