using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class EventRepository : IEventRepository
    {
        private readonly ApplicationDbContext _context;

        public EventRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Event>> GetAllAsync()
        {
            return await _context.Events
                .AsNoTracking()
                .Include(e => e.Venue)
                .Include(e => e.Category)
                .ToListAsync();
        }

        public async Task<Event?> GetByIdAsync(int id)
        {
            return await _context.Events
                .Include(e => e.Venue)
                .Include(e => e.Category)
                .FirstOrDefaultAsync(e => e.EventId == id);
        }

        public async Task<IEnumerable<Event>> SearchAsync(
            string? name,
            int? categoryId,
            int? venueId,
            DateTime? eventDate)
        {
            var query = _context.Events
                .AsNoTracking()
                .Include(e => e.Venue)
                .Include(e => e.Category)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(name))
            {
                query = query.Where(e => e.Name.Contains(name));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(e => e.CategoryId == categoryId.Value);
            }

            if (venueId.HasValue)
            {
                query = query.Where(e => e.VenueId == venueId.Value);
            }

            if (eventDate.HasValue)
            {
                query = query.Where(e =>
                    e.EventDate.Date == eventDate.Value.Date);
            }

            return await query.ToListAsync();
        }

        public async Task<bool> HasOverlapAsync(
            int venueId,
            DateTime eventDate,
            TimeSpan startTime,
            TimeSpan endTime,
            int? excludeEventId = null)
        {
            var query = _context.Events.Where(e =>
                e.VenueId == venueId &&
                e.EventDate.Date == eventDate.Date &&
                e.StartTime < endTime &&
                e.EndTime > startTime);

            if (excludeEventId.HasValue)
            {
                query = query.Where(e =>
                    e.EventId != excludeEventId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task AddAsync(Event eventEntity)
        {
            await _context.Events.AddAsync(eventEntity);
        }

        public void Update(Event eventEntity)
        {
            _context.Events.Update(eventEntity);
        }

        public void Delete(Event eventEntity)
        {
            _context.Events.Remove(eventEntity);
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}