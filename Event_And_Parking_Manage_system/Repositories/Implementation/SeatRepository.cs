using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class SeatRepository : ISeatRepository
    {
        private readonly ApplicationDbContext _context;

        public SeatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Seat>> GetSeatsByEventIdAsync(int eventId)
        {
            return await _context.Seats
                .Where(x => x.EventId == eventId)
                .OrderBy(x => x.SeatNumber)
                .ToListAsync();
        }

        public async Task<Seat?> GetByIdAsync(int seatId)
        {
            return await _context.Seats
                .FirstOrDefaultAsync(x => x.SeatId == seatId);
        }

        public async Task<IEnumerable<Seat>> GetByIdsAsync(
            IEnumerable<int> seatIds)
        {
            return await _context.Seats
                .Where(x => seatIds.Contains(x.SeatId))
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(int seatId)
        {
            return await _context.Seats
                .AnyAsync(x => x.SeatId == seatId);
        }

        public async Task<bool> ExistsBySeatNumberAsync(
            int eventId,
            string seatNumber)
        {
            return await _context.Seats
                .AnyAsync(x =>
                    x.EventId == eventId &&
                    x.SeatNumber == seatNumber);
        }

        public async Task AddAsync(Seat seat)
        {
            await _context.Seats.AddAsync(seat);
        }

        public Task UpdateAsync(Seat seat)
        {
            _context.Seats.Update(seat);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Seat seat)
        {
            _context.Seats.Remove(seat);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}