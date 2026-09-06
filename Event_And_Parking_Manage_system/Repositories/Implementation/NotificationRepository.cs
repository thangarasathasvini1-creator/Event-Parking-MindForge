using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Repositories.Implementation
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly ApplicationDbContext _context;

        public NotificationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Notification>> GetByCustomerIdAsync(
            int customerId)
        {
            return await _context.Notifications
                .Where(n => n.CustomerId == customerId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<Notification?> GetByIdAsync(
            int notificationId)
        {
            return await _context.Notifications
                .FirstOrDefaultAsync(
                    n => n.NotificationId == notificationId);
        }

        public async Task AddAsync(
            Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
        }

        public async Task UpdateAsync(
            Notification notification)
        {
            _context.Notifications.Update(notification);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}