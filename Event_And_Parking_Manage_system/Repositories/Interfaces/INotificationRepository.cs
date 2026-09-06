using Event_And_Parking_Manage_system.Models.Entities;

namespace Event_And_Parking_Manage_system.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        Task<List<Notification>> GetByCustomerIdAsync(int customerId);

        Task<Notification?> GetByIdAsync(int notificationId);

        Task AddAsync(Notification notification);

        Task UpdateAsync(Notification notification);

        Task SaveChangesAsync();
    }
}