namespace Event_And_Parking_Manage_system.DTOs.Customers
{
    public class CustomerDashboardDto
    {
        public int UpcomingBookings { get; set; }

        public int ReservedParking { get; set; }

        public int RecentPayments { get; set; }

        public int UnreadNotifications { get; set; }
    }
}