namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class Venue
    {
        public int VenueId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public int TotalCapacity { get; set; }

        public int TotalParkingSlots { get; set; }

        public int CarCapacity { get; set; }

        public int BikeCapacity { get; set; }

        public int BusCapacity { get; set; }

        public int VanCapacity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<Event> Events { get; set; }
            = new List<Event>();
    }
}