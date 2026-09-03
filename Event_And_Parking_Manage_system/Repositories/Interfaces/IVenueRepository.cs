using Event_And_Parking_Manage_system.Models.Entities;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface IVenueRepository
    {
        Task<IEnumerable<Venue>> GetAllAsync();

        Task<Venue?> GetByIdAsync(int id);

        Task<IEnumerable<Venue>> GetAvailableAsync(
            DateTime eventDate,
            TimeSpan startTime,
            TimeSpan endTime);

        Task AddAsync(Venue venue);

        void Update(Venue venue);

        void Delete(Venue venue);

        Task<bool> SaveChangesAsync();
    }
}