using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Event_And_Parking_Manage_system.BackgroundServices
{
    public class BookingExpiryService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BookingExpiryService> _logger;

        public BookingExpiryService(
            IServiceScopeFactory scopeFactory,
            ILogger<BookingExpiryService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "Booking Expiry Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ExpireBookingsAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Application is stopping
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Error occurred while expiring bookings.");
                }

                try
                {
                    await Task.Delay(
                        TimeSpan.FromMinutes(1),
                        stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Application is stopping
                }
            }

            _logger.LogInformation(
                "Booking Expiry Service stopped.");
        }

        private async Task ExpireBookingsAsync(
            CancellationToken cancellationToken)
        {
            using var scope =
                _scopeFactory.CreateScope();

            var context =
                scope.ServiceProvider
                    .GetRequiredService<ApplicationDbContext>();

            var now = DateTime.UtcNow;

            var expiredBookings =
                await context.Bookings
                    .Where(b =>
                        b.Status == BookingStatus.Pending &&
                        b.HoldExpiresAt.HasValue &&
                        b.HoldExpiresAt.Value <= now)
                    .ToListAsync(cancellationToken);

            if (expiredBookings.Count == 0)
            {
                return;
            }

            foreach (var booking in expiredBookings)
            {
                booking.Status = BookingStatus.Expired;
                booking.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync(
                cancellationToken);

            _logger.LogInformation(
                "{Count} booking(s) expired.",
                expiredBookings.Count);
        }
    }
}