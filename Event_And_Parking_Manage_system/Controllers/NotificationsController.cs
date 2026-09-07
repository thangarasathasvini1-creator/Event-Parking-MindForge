using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(
            INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // ==========================================
        // GET: api/notifications/customer/{customerId}
        // Get Customer Notifications
        // ==========================================

        [HttpGet("customer/{customerId:int}")]
        public async Task<IActionResult> GetCustomerNotifications(
            int customerId)
        {
            var currentCustomerId = GetCustomerId();

            if (currentCustomerId == null)
            {
                return Unauthorized();
            }

            // Customer can view only their own notifications.
            // Administrator can view any customer's notifications.
            if (currentCustomerId.Value != customerId &&
                !User.IsInRole("Administrator"))
            {
                return Forbid();
            }

            var notifications =
                await _notificationService
                    .GetCustomerNotificationsAsync(customerId);

            return Ok(notifications);
        }

        // ==========================================
        // PUT: api/notifications/{id}/read
        // Mark Notification as Read
        // ==========================================

        [HttpPut("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var customerId = GetCustomerId();

            if (customerId == null)
            {
                return Unauthorized();
            }

            try
            {
                var result =
                    await _notificationService
                        .MarkAsReadAsync(
                            id,
                            customerId.Value);

                if (!result)
                {
                    return NotFound(new
                    {
                        message = "Notification not found."
                    });
                }

                return Ok(new
                {
                    message = "Notification marked as read."
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // ==========================================
        // Helper - Get Customer ID from JWT
        // ==========================================

        private int? GetCustomerId()
        {
            var customerIdClaim =
                User.FindFirst("CustomerId")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(
                customerIdClaim,
                out var customerId))
            {
                return customerId;
            }

            return null;
        }
    }
}