using Event_And_Parking_Manage_system.Models.Entities;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<EventCategory>> GetAllAsync();

        Task<EventCategory?> GetByIdAsync(int id);

        Task<EventCategory?> GetByNameAsync(string name);

        Task AddAsync(EventCategory category);

        void Update(EventCategory category);

        void Delete(EventCategory category);

        Task<bool> SaveChangesAsync();
    }
}