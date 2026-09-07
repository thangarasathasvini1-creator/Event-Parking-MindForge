using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Services.Implementation
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
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope =
                        _scopeFactory.CreateScope();

                    var context =
                        scope.ServiceProvider
                            .GetRequiredService<ApplicationDbContext>();

                    var notificationService =
                        scope.ServiceProvider
                            .GetRequiredService<INotificationService>();

                    var now = DateTime.UtcNow;

                    // ==========================================
                    // Find Expired Pending Bookings
                    // ==========================================

                    var expiredBookings =
                        await context.Bookings
                            .Include(b => b.BookingSeats)
                                .ThenInclude(bs => bs.Seat)
                            .Include(b => b.ParkingReservation)
                                .ThenInclude(pr => pr!.ParkingSlot)
                            .Where(b =>
                                b.Status == BookingStatus.Pending &&
                                b.HoldExpiresAt.HasValue &&
                                b.HoldExpiresAt.Value <= now)
                            .ToListAsync(stoppingToken);

                    // ==========================================
                    // Process Expired Bookings
                    // ==========================================

                    foreach (var booking in expiredBookings)
                    {
                        // --------------------------------------
                        // Release Seats
                        // --------------------------------------

                        foreach (var bookingSeat in
                                 booking.BookingSeats)
                        {
                            if (bookingSeat.Seat != null &&
                                bookingSeat.Seat.Status ==
                                SeatStatus.Held)
                            {
                                bookingSeat.Seat.Status =
                                    SeatStatus.Available;

                                bookingSeat.Seat.UpdatedAt =
                                    now;
                            }
                        }

                        // --------------------------------------
                        // Release Parking
                        // --------------------------------------

                        if (booking.ParkingReservation?.ParkingSlot != null)
                        {
                            var parkingSlot =
                                booking.ParkingReservation.ParkingSlot;

                            if (parkingSlot.Status ==
                                ParkingSlotStatus.Held)
                            {
                                parkingSlot.Status =
                                    ParkingSlotStatus.Available;

                                parkingSlot.UpdatedAt =
                                    now;
                            }
                        }

                        // --------------------------------------
                        // Expire Booking
                        // --------------------------------------

                        booking.Status =
                            BookingStatus.Expired;

                        booking.UpdatedAt =
                            now;
                    }

                    // ==========================================
                    // Save Expired Bookings
                    // ==========================================

                    if (expiredBookings.Count > 0)
                    {
                        await context.SaveChangesAsync(
                            stoppingToken);

                        _logger.LogInformation(
                            "{Count} expired booking(s) processed.",
                            expiredBookings.Count);

                        // ======================================
                        // Create Expiry Notifications
                        // ======================================

                        foreach (var booking in expiredBookings)
                        {
                            try
                            {
                                await notificationService
                                    .CreateNotificationAsync(
                                        booking.CustomerId,
                                        "BookingExpired",
                                        $"Your booking {booking.BookingNumber} has expired because the payment hold period ended.");
                            }
                            catch (Exception notificationEx)
                            {
                                // Booking expiry already succeeded.
                                // Notification failure should not
                                // undo the expiry.
                                _logger.LogError(
                                    notificationEx,
                                    "Booking {BookingId} expired successfully, but expiry notification failed.",
                                    booking.BookingId);
                            }
                        }
                    }
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Concurrency conflict while processing expired bookings.");
                }
                catch (OperationCanceledException)
                    when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Error while processing expired bookings.");
                }

                // ==========================================
                // Wait One Minute Before Next Check
                // ==========================================

                try
                {
                    await Task.Delay(
                        TimeSpan.FromMinutes(1),
                        stoppingToken);
                }
                catch (OperationCanceledException)
                    when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }
    }
}