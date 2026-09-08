namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class EventCategory
    {
        public int CategoryId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<Event> Events { get; set; }
            = new List<Event>();
    }
}