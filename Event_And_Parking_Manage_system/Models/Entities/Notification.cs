namespace Event_And_Parking_Manage_system.Models.Entities
{
    public class Notification
    {
        public int NotificationId { get; set; }

        public int CustomerId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }

        // Navigation Property
        public Customer Customer { get; set; } = null!;
    }
}