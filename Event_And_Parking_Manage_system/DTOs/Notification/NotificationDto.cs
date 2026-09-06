namespace Event_And_Parking_Manage_system.DTOs.Notifications
{
    public class NotificationDto
    {
        public int NotificationId { get; set; }

        public int CustomerId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? ReadAt { get; set; }
    }
}