namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class ParkingReservation
    {
        public int ParkingReservationId { get; set; }

        public int BookingId { get; set; }

        public int ParkingSlotId { get; set; }

        public decimal ReservedFee { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Booking Booking { get; set; } = null!;

        public ParkingSlot ParkingSlot { get; set; } = null!;
    }
}