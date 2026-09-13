namespace Event_And_Parking_Manage_system.DTOs.Bookings;
public record HoldStatusDto(int BookingId, string Status, DateTime ServerTimeUtc,
    DateTime? HoldExpiresAt, int RemainingSeconds, bool CanPay);
