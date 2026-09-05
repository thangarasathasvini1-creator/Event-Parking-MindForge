using Event_And_Parking_Manage_system.DTOs.Dashboard;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly IAdminDashboardRepository _dashboardRepository;

        public AdminDashboardService(
            IAdminDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync()
        {
            var totalBookings =
                await _dashboardRepository.GetTotalBookingsAsync();

            var totalRevenue =
                await _dashboardRepository.GetTotalRevenueAsync();

            var totalSeatsBooked =
                await _dashboardRepository.GetTotalSeatsBookedAsync();

            var totalParkingReservations =
                await _dashboardRepository
                    .GetTotalParkingReservationsAsync();

            var confirmedBookings =
                await _dashboardRepository
                    .GetConfirmedBookingsAsync();

            var pendingBookings =
                await _dashboardRepository
                    .GetPendingBookingsAsync();

            var cancelledBookings =
                await _dashboardRepository
                    .GetCancelledBookingsAsync();

            var expiredBookings =
                await _dashboardRepository
                    .GetExpiredBookingsAsync();

            var totalAvailableSeats =
                await _dashboardRepository
                    .GetTotalAvailableSeatsAsync();

            var totalAvailableParkingSlots =
                await _dashboardRepository
                    .GetTotalAvailableParkingSlotsAsync();

            var eventData =
                await _dashboardRepository
                    .GetEventBookingSummariesAsync();

            var totalSeats =
                eventData.Sum(e => e.TotalSeats);

            var totalParkingSlots =
                eventData.Sum(e => e.TotalParkingSlots);

            var overallSeatOccupancyPercentage =
                totalSeats > 0
                    ? (decimal)totalSeatsBooked /
                      totalSeats * 100
                    : 0m;

            var overallParkingUtilizationPercentage =
                totalParkingSlots > 0
                    ? (decimal)totalParkingReservations /
                      totalParkingSlots * 100
                    : 0m;

            var eventSummaries =
                eventData.Select(e =>
                    new EventBookingSummaryDto
                    {
                        EventId = e.EventId,

                        EventName = e.EventName,

                        BookingCount = e.BookingCount,

                        SeatsBooked = e.SeatsBooked,

                        TotalSeats = e.TotalSeats,

                        Revenue = e.Revenue,

                        OccupancyPercentage =
                            e.TotalSeats > 0
                                ? (decimal)e.SeatsBooked /
                                  e.TotalSeats * 100
                                : 0m,

                        ParkingReservations =
                            e.ParkingReservations,

                        TotalParkingSlots =
                            e.TotalParkingSlots,

                        ParkingUtilizationPercentage =
                            e.TotalParkingSlots > 0
                                ? (decimal)e.ParkingReservations /
                                  e.TotalParkingSlots * 100
                                : 0m
                    })
                .ToList();

            return new AdminDashboardDto
            {
                TotalBookings =
                    totalBookings,

                TotalRevenue =
                    totalRevenue,

                TotalSeatsBooked =
                    totalSeatsBooked,

                TotalParkingReservations =
                    totalParkingReservations,

                ConfirmedBookings =
                    confirmedBookings,

                PendingBookings =
                    pendingBookings,

                CancelledBookings =
                    cancelledBookings,

                ExpiredBookings =
                    expiredBookings,

                TotalAvailableSeats =
                    totalAvailableSeats,

                OverallSeatOccupancyPercentage =
                    Math.Round(
                        overallSeatOccupancyPercentage,
                        2),

                TotalAvailableParkingSlots =
                    totalAvailableParkingSlots,

                OverallParkingUtilizationPercentage =
                    Math.Round(
                        overallParkingUtilizationPercentage,
                        2),

                EventSummaries =
                    eventSummaries
            };
        }
    }
}