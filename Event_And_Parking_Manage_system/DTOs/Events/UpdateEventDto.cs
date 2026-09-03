namespace Event_And_Parking_Manage_system.DTOs.Events
{
    public class UpdateEventDto
    {
        public string Name { get; set; } = string.Empty;

        public int VenueId { get; set; }

        public int CategoryId { get; set; }

        public DateTime EventDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public decimal TicketPrice { get; set; }

        public decimal ParkingFee { get; set; }

        public int Capacity { get; set; }
    }
}