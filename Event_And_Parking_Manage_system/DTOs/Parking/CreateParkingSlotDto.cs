namespace Event_And_Parking_Manage_system.DTOs.Parking
{
    public class CreateParkingSlotDto
    {
        public string SlotNumber { get; set; } = string.Empty;
        public string? Zone { get; set; }
        public decimal Fee { get; set; }
    }
}