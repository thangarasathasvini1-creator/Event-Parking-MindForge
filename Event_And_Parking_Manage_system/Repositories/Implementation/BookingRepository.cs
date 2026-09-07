using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class BookingRepository : IBookingRepository
    {
        private readonly ApplicationDbContext _context;

        public BookingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET BOOKING BY ID
        // =========================================================

        public async Task<Booking?> GetByIdAsync(int bookingId)
        {
            return await _context.Bookings
                .Include(b => b.BookingSeats)
                    .ThenInclude(bs => bs.Seat)
                .Include(b => b.ParkingReservation)
                    .ThenInclude(pr => pr!.ParkingSlot)
                .Include(b => b.Payment)
                .Include(b => b.Event)
                .FirstOrDefaultAsync(
                    b => b.BookingId == bookingId);
        }

        // =========================================================
        // GET BOOKING BY BOOKING NUMBER
        // =========================================================

        public async Task<Booking?> GetByBookingNumberAsync(
            string bookingNumber)
        {
            return await _context.Bookings
                .FirstOrDefaultAsync(
                    b => b.BookingNumber == bookingNumber);
        }

        // =========================================================
        // GET BOOKINGS BY CUSTOMER
        // =========================================================

        public async Task<List<Booking>> GetByCustomerIdAsync(
            int customerId)
        {
            return await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.BookingSeats)
                .Include(b => b.ParkingReservation)
                .Include(b => b.Payment)
                .Where(b => b.CustomerId == customerId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        // =========================================================
        // GET BOOKINGS BY EVENT
        // =========================================================

        public async Task<List<Booking>> GetByEventIdAsync(
            int eventId)
        {
            return await _context.Bookings
                .Include(b => b.BookingSeats)
                .Include(b => b.ParkingReservation)
                .Include(b => b.Payment)
                .Where(b => b.EventId == eventId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        // =========================================================
        // GET CUSTOMER IDS BY EVENT
        // =========================================================

        public async Task<List<int>> GetCustomerIdsByEventIdAsync(
            int eventId)
        {
            return await _context.Bookings
                .Where(b =>
                    b.EventId == eventId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.Expired)
                .Select(b => b.CustomerId)
                .Distinct()
                .ToListAsync();
        }

        // =========================================================
        // ADD BOOKING
        // =========================================================

        public async Task AddAsync(Booking booking)
        {
            await _context.Bookings.AddAsync(booking);
        }

        // =========================================================
        // UPDATE BOOKING
        // =========================================================

        public async Task UpdateAsync(Booking booking)
        {
            _context.Bookings.Update(booking);

            await Task.CompletedTask;
        }

        // =========================================================
        // CHECK ACTIVE SEAT BOOKING
        // =========================================================

        public async Task<bool> HasActiveSeatBookingAsync(
            int seatId,
            int eventId)
        {
            return await _context.BookingSeats
                .AnyAsync(bs =>
                    bs.SeatId == seatId &&
                    bs.Booking.EventId == eventId &&
                    bs.Booking.Status != BookingStatus.Cancelled &&
                    bs.Booking.Status != BookingStatus.Expired);
        }

        // =========================================================
        // CHECK ACTIVE PARKING RESERVATION
        // =========================================================

        public async Task<bool> HasActiveParkingReservationAsync(
            int parkingSlotId,
            int eventId)
        {
            return await _context.ParkingReservations
                .AnyAsync(pr =>
                    pr.ParkingSlotId == parkingSlotId &&
                    pr.Booking.EventId == eventId &&
                    pr.Booking.Status != BookingStatus.Cancelled &&
                    pr.Booking.Status != BookingStatus.Expired);
        }

        // =========================================================
        // SAVE CHANGES
        // =========================================================

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}