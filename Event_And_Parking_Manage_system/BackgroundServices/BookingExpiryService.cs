using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Microsoft.EntityFrameworkCore;
namespace Event_And_Parking_Manage_system.Services.Implementation;
public class BookingExpiryService(IServiceScopeFactory scopes, ILogger<BookingExpiryService> logger, IConfiguration configuration) : BackgroundService
{
    public static async Task<bool> ExpireAsync(ApplicationDbContext db, int id, CancellationToken ct = default)
    {
        await using var transaction = await db.BeginReservationTransactionAsync(ct);
        var booking = await db.Bookings.Include(b => b.BookingSeats).ThenInclude(s => s.Seat)
            .Include(b => b.ParkingReservation).ThenInclude(p => p!.ParkingSlot).SingleOrDefaultAsync(b => b.BookingId == id, ct);
        if (booking == null || booking.Status != BookingStatus.Pending || booking.HoldExpiresAt == null || booking.HoldExpiresAt > DateTime.UtcNow) return false;
        foreach (var item in booking.BookingSeats) item.Seat.Status = SeatStatus.Available;
        if (booking.ParkingReservation != null) booking.ParkingReservation.ParkingSlot.Status = ParkingSlotStatus.Available;
        booking.Status = BookingStatus.Expired;
        booking.HoldExpiresAt = null;
        booking.UpdatedAt = DateTime.UtcNow;
        db.Notifications.Add(new Notification { CustomerId = booking.CustomerId, Type = "BookingExpired", Message = $"Booking {booking.BookingNumber} expired because payment was not completed." });
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return true;
    }
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                List<int> ids;
                using (var scope = scopes.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    ids = await db.Bookings.AsNoTracking().Where(b => b.Status == BookingStatus.Pending && b.HoldExpiresAt <= DateTime.UtcNow).Select(b => b.BookingId).ToListAsync(ct);
                }
                foreach (var id in ids)
                {
                    try
                    {
                        // Each record gets a fresh context, transaction and state check.
                        using var scope = scopes.CreateScope();
                        await ExpireAsync(scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(), id, ct);
                    }
                    catch (OperationCanceledException) when (ct.IsCancellationRequested) { return; }
                    catch (Exception ex) { logger.LogWarning(ex, "Expiry will retry booking {BookingId}", id); }
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { return; }
            catch (Exception ex) { logger.LogError(ex, "Expiry scan failed"); }
            try { await Task.Delay(TimeSpan.FromSeconds(Math.Clamp(configuration.GetValue<int?>("Booking:ExpiryScanSeconds") ?? 60, 1, 3600)), ct); }
            catch (OperationCanceledException) { return; }
        }
    }
}
