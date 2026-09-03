using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class ParkingSlot
    {
        public int ParkingSlotId { get; set; }

        public int EventId { get; set; }

        public string SlotNumber { get; set; } = string.Empty;

        public string? Zone { get; set; }

        public decimal Fee { get; set; }

        public ParkingSlotStatus Status { get; set; } = ParkingSlotStatus.Available;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        //Navigation Property
        public Event Event { get; set; } = null!;

        public ICollection<ParkingReservation> ParkingReservations { get; set; } = new List<ParkingReservation>();
    }
}