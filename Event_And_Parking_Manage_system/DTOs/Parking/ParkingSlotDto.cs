using Event_And_Parking_Manage_system.Models.Enums;

namespace Event_And_Parking_Manage_system.DTOs.Parking
{
    public class ParkingSlotDto
    {
        public int ParkingSlotId { get; set; }
        public int EventId { get; set; }
        public string SlotNumber { get; set; } = string.Empty;
        public string? Zone { get; set; }
        public decimal Fee { get; set; }
        public ParkingSlotStatus Status { get; set; }
    }
}