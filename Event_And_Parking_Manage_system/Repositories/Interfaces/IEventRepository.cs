using Event_And_Parking_Manage_system.Models.Entities;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface IEventRepository
    {
        Task<IEnumerable<Event>> GetAllAsync();

        Task<Event?> GetByIdAsync(int id);

        Task<IEnumerable<Event>> SearchAsync(
            string? name,
            int? categoryId,
            int? venueId,
            DateTime? eventDate);

        Task<bool> HasOverlapAsync(
            int venueId,
            DateTime eventDate,
            TimeSpan startTime,
            TimeSpan endTime,
            int? excludeEventId = null);

        Task AddAsync(Event eventEntity);

        void Update(Event eventEntity);

        void Delete(Event eventEntity);

        Task<bool> SaveChangesAsync();
    }
}