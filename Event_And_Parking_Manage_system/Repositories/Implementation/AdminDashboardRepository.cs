using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class AdminDashboardRepository : IAdminDashboardRepository
    {
        private readonly ApplicationDbContext _context;

        public AdminDashboardRepository(
            ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalBookingsAsync()
        {
            return await _context.Bookings
                .CountAsync();
        }

        public async Task<decimal> GetTotalRevenueAsync()
        {
            return await _context.Payments
                .Where(p => p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);
        }

        public async Task<int> GetTotalSeatsBookedAsync()
        {
            return await _context.BookingSeats
                .CountAsync(bs =>
                    bs.Booking.Status == BookingStatus.Confirmed);
        }

        public async Task<int> GetTotalParkingReservationsAsync()
        {
            return await _context.ParkingReservations
                .CountAsync(pr =>
                    pr.Booking.Status == BookingStatus.Confirmed);
        }

        public async Task<int> GetConfirmedBookingsAsync()
        {
            return await _context.Bookings
                .CountAsync(b =>
                    b.Status == BookingStatus.Confirmed);
        }

        public async Task<int> GetPendingBookingsAsync()
        {
            return await _context.Bookings
                .CountAsync(b =>
                    b.Status == BookingStatus.Pending);
        }

        public async Task<int> GetCancelledBookingsAsync()
        {
            return await _context.Bookings
                .CountAsync(b =>
                    b.Status == BookingStatus.Cancelled);
        }

        public async Task<int> GetExpiredBookingsAsync()
        {
            return await _context.Bookings
                .CountAsync(b =>
                    b.Status == BookingStatus.Expired);
        }

        public async Task<int> GetTotalAvailableSeatsAsync()
        {
            return await _context.Seats
                .CountAsync(s =>
                    s.Status == SeatStatus.Available);
        }

        public async Task<int> GetTotalAvailableParkingSlotsAsync()
        {
            return await _context.ParkingSlots
                .CountAsync(p =>
                    p.Status == ParkingSlotStatus.Available);
        }

        public async Task<List<EventBookingSummaryData>>
            GetEventBookingSummariesAsync()
        {
            var events = await _context.Events
                .Include(e => e.Seats)
                .Include(e => e.ParkingSlots)
                .Include(e => e.Bookings)
                    .ThenInclude(b => b.BookingSeats)
                .Include(e => e.Bookings)
                    .ThenInclude(b => b.ParkingReservation)
                .Include(e => e.Bookings)
                    .ThenInclude(b => b.Payment)
                .ToListAsync();

            var summaries = events
                .Select(e =>
                {
                    var confirmedBookings = e.Bookings
                        .Where(b =>
                            b.Status == BookingStatus.Confirmed)
                        .ToList();

                    var seatsBooked = confirmedBookings
                        .SelectMany(b => b.BookingSeats)
                        .Count();

                    var parkingReservations = confirmedBookings
                        .Count(b =>
                            b.ParkingReservation != null);

                    var revenue = confirmedBookings
                        .SelectMany(b =>
                            b.Payment != null
                                ? new[] { b.Payment }
                                : Array.Empty<Models.Entities.Payment>())
                        .Where(p =>
                            p.Status == PaymentStatus.Completed)
                        .Sum(p => p.Amount);

                    var totalSeats = e.Seats.Count;

                    var totalParkingSlots =
                        e.ParkingSlots.Count;

                    var occupancyPercentage =
                        totalSeats > 0
                            ? (decimal)seatsBooked /
                              totalSeats * 100
                            : 0m;

                    var parkingUtilizationPercentage =
                        totalParkingSlots > 0
                            ? (decimal)parkingReservations /
                              totalParkingSlots * 100
                            : 0m;

                    return new EventBookingSummaryData
                    {
                        EventId = e.EventId,

                        EventName =
                            e.Name ?? string.Empty,

                        BookingCount =
                            confirmedBookings.Count,

                        SeatsBooked =
                            seatsBooked,

                        TotalSeats =
                            totalSeats,

                        Revenue =
                            revenue,

                        ParkingReservations =
                            parkingReservations,

                        TotalParkingSlots =
                            totalParkingSlots
                    };
                })
                .ToList();

            return summaries;
        }
    }
}