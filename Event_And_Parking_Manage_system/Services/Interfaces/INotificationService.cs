using Event_And_Parking_Manage_system.DTOs.Notifications;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetCustomerNotificationsAsync(
            int customerId);

        Task<bool> MarkAsReadAsync(
            int notificationId,
            int customerId);
    }
}