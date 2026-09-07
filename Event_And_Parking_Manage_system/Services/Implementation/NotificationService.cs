using Event_And_Parking_Manage_system.DTOs.Notifications;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(
            INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        // =========================================================
        // GET CUSTOMER NOTIFICATIONS
        // =========================================================

        public async Task<List<NotificationDto>>
            GetCustomerNotificationsAsync(int customerId)
        {
            var notifications =
                await _notificationRepository
                    .GetByCustomerIdAsync(customerId);

            return notifications
                .Select(n => new NotificationDto
                {
                    NotificationId = n.NotificationId,
                    CustomerId = n.CustomerId,
                    Type = n.Type,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    ReadAt = n.ReadAt
                })
                .ToList();
        }

        // =========================================================
        // MARK NOTIFICATION AS READ
        // =========================================================

        public async Task<bool> MarkAsReadAsync(
            int notificationId,
            int customerId)
        {
            var notification =
                await _notificationRepository
                    .GetByIdAsync(notificationId);

            if (notification == null)
                return false;

            if (notification.CustomerId != customerId)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to update this notification.");
            }

            if (notification.IsRead)
                return true;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await _notificationRepository
                .UpdateAsync(notification);

            await _notificationRepository
                .SaveChangesAsync();

            return true;
        }

        // =========================================================
        // CREATE NOTIFICATION
        // =========================================================

        public async Task CreateNotificationAsync(
            int customerId,
            string type,
            string message)
        {
            if (customerId <= 0)
                throw new ArgumentException(
                    "A valid customerId is required.");

            if (string.IsNullOrWhiteSpace(type))
                throw new ArgumentException(
                    "Notification type is required.");

            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException(
                    "Notification message is required.");

            var notification = new Notification
            {
                CustomerId = customerId,
                Type = type.Trim(),
                Message = message.Trim(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository
                .AddAsync(notification);

            await _notificationRepository
                .SaveChangesAsync();
        }
    }
}