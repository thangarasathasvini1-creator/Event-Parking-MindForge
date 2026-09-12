namespace Event_And_Parking_Manage_system.DTOs.Venues
{
    public class VenueDto
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
    }
}