using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class VenueRepository : IVenueRepository
    {
        private readonly ApplicationDbContext _context;

        public VenueRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Venue>> GetAllAsync()
        {
            return await _context.Venues
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Venue?> GetByIdAsync(int id)
        {
            return await _context.Venues
                .FirstOrDefaultAsync(v => v.VenueId == id);
        }

        public async Task<IEnumerable<Venue>> GetAvailableAsync(
            DateTime eventDate,
            TimeSpan startTime,
            TimeSpan endTime)
        {
            return await _context.Venues
                .AsNoTracking()
                .Where(v => !_context.Events.Any(e =>
                    e.VenueId == v.VenueId &&
                    e.EventDate.Date == eventDate.Date &&
                    e.StartTime < endTime &&
                    e.EndTime > startTime))
                .ToListAsync();
        }

        public async Task AddAsync(Venue venue)
        {
            await _context.Venues.AddAsync(venue);
        }

        public void Update(Venue venue)
        {
            _context.Venues.Update(venue);
        }

        public void Delete (Venue venue)
        {
            _context.Venues.Remove(venue);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}