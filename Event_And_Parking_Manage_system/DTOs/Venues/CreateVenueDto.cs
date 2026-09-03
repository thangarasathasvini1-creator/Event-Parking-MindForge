namespace Event_And_Parking_Manage_system.DTOs.Venues
{
    public class CreateVenueDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
    }
}