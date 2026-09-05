namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface IAdminDashboardRepository
    {
        Task<int> GetTotalBookingsAsync();

        Task<decimal> GetTotalRevenueAsync();

        Task<int> GetTotalSeatsBookedAsync();

        Task<int> GetTotalParkingReservationsAsync();

        Task<int> GetConfirmedBookingsAsync();

        Task<int> GetPendingBookingsAsync();

        Task<int> GetCancelledBookingsAsync();

        Task<int> GetExpiredBookingsAsync();

        Task<int> GetTotalAvailableSeatsAsync();

        Task<int> GetTotalAvailableParkingSlotsAsync();

        Task<List<EventBookingSummaryData>> GetEventBookingSummariesAsync();
    }

    public class EventBookingSummaryData
    {
        public int EventId { get; set; }

        public string EventName { get; set; } = string.Empty;

        public int BookingCount { get; set; }

        public int SeatsBooked { get; set; }

        public int TotalSeats { get; set; }

        public decimal Revenue { get; set; }

        public int ParkingReservations { get; set; }

        public int TotalParkingSlots { get; set; }
    }
}