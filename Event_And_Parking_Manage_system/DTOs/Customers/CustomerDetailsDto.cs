namespace Event_And_Parking_Manage_system.DTOs.Customers
{
    public class CustomerDetailsDto
    {
        public int CustomerId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public bool EmailVerified { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int TotalBookings { get; set; }
    }
}
