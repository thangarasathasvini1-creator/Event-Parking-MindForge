namespace Event_And_Parking_Manage_system.DTOs.Dashboard
{
    public class AdminDashboardDto
    {
        public int TotalBookings { get; set; }

        public decimal TotalRevenue { get; set; }

        public int TotalSeatsBooked { get; set; }

        public int TotalParkingReservations { get; set; }

        public int ConfirmedBookings { get; set; }

        public int PendingBookings { get; set; }

        public int CancelledBookings { get; set; }

        public int ExpiredBookings { get; set; }

        public List<EventBookingSummaryDto> EventSummaries { get; set; }
            = new();

        public int TotalAvailableSeats { get; set; }

        public decimal OverallSeatOccupancyPercentage { get; set; }

        public int TotalAvailableParkingSlots { get; set; }

        public decimal OverallParkingUtilizationPercentage { get; set; }
    }

    public class EventBookingSummaryDto
    {
        public int EventId { get; set; }

        public string EventName { get; set; } = string.Empty;

        public int BookingCount { get; set; }

        public int SeatsBooked { get; set; }

        public int TotalSeats { get; set; }

        public decimal Revenue { get; set; }

        public decimal OccupancyPercentage { get; set; }

        public int ParkingReservations { get; set; }

        public int TotalParkingSlots { get; set; }

        public decimal ParkingUtilizationPercentage { get; set; }
    }
}