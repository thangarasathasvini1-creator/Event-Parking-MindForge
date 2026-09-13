using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Bookings;
using Event_And_Parking_Manage_system.DTOs.Seats;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Microsoft.EntityFrameworkCore;
namespace Event_And_Parking_Manage_system.Services.Implementation;

public record GenerateSeatMapDto(int Count, int Columns, int VipSeatsCount = 0);
public record GenerateParkingLayoutDto(int Count, string Zone, VehicleType VehicleType, decimal Fee);
public record AdminPaymentDto(int PaymentId, int BookingId, string BookingNumber, int CustomerId,
    string CustomerName, string EventName, decimal Amount, string Status, string? TransactionReference, DateTime? PaidAt);

public class ReservationManagementService(ApplicationDbContext db)
{
    public async Task<HoldStatusDto> GetHoldAsync(int id, int customerId, bool admin)
    {
        var booking = await db.Bookings.AsNoTracking().SingleOrDefaultAsync(b => b.BookingId == id)
            ?? throw new KeyNotFoundException("Booking not found.");
        if (!admin && booking.CustomerId != customerId) throw new UnauthorizedAccessException("This booking belongs to another customer.");
        var now = DateTime.UtcNow;
        var remaining = booking.Status == BookingStatus.Pending && booking.HoldExpiresAt.HasValue
            ? Math.Max(0, (int)Math.Ceiling((booking.HoldExpiresAt.Value - now).TotalSeconds)) : 0;
        return new(id, booking.Status.ToString(), now, booking.HoldExpiresAt, remaining, remaining > 0);
    }
    public async Task<List<AdminPaymentDto>> GetPaymentsAsync(string? search, int? eventId, string? status)
    {
        var query = db.Payments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(p => p.Booking.BookingNumber.Contains(search) || p.Booking.Customer.Name.Contains(search) || p.Booking.Customer.Email.Contains(search));
        if (eventId.HasValue) query = query.Where(p => p.Booking.EventId == eventId);
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<PaymentStatus>(status, true, out var parsed) || !Enum.IsDefined(parsed)) throw new ArgumentException("Invalid payment status.");
            query = query.Where(p => p.Status == parsed);
        }
        return await query.OrderByDescending(p => p.CreatedAt).Select(p => new AdminPaymentDto(p.PaymentId,
            p.BookingId, p.Booking.BookingNumber, p.Booking.CustomerId, p.Booking.Customer.Name,
            p.Booking.Event.Name, p.Amount, p.Status.ToString(), p.TransactionReference, p.PaidAt)).ToListAsync();
    }
    public async Task<List<SeatDto>> GenerateSeatsAsync(int eventId, GenerateSeatMapDto dto)
    {
        await using var transaction = await db.BeginReservationTransactionAsync();
        var ev = await db.Events.SingleOrDefaultAsync(e => e.EventId == eventId) ?? throw new KeyNotFoundException("Event not found.");
        if (dto.Count != ev.Capacity || dto.Columns < 1 || dto.Columns > dto.Count)
            throw new ArgumentException("Seat count must equal event capacity; columns must be between 1 and the seat count.");
        if (dto.VipSeatsCount < 0 || dto.VipSeatsCount > dto.Count)
            throw new ArgumentException("VIP seat count must be between 0 and the total seat count.");
        if (await db.Bookings.AnyAsync(b => b.EventId == eventId)) throw new InvalidOperationException("A seat map cannot be replaced after bookings exist.");
        db.Seats.RemoveRange(await db.Seats.Where(s => s.EventId == eventId).ToListAsync());
        await db.SaveChangesAsync();
        var seats = Enumerable.Range(0, dto.Count).Select(i => {
            int rowNum = (i / dto.Columns + 1);
            int colNum = (i % dto.Columns + 1);
            bool isVip = i < dto.VipSeatsCount;
            return new Seat {
                EventId = eventId,
                SeatNumber = isVip ? $"VIP-{i + 1}" : $"R{rowNum}-{colNum}",
                Row = rowNum.ToString(),
                Column = colNum.ToString(),
                Status = isVip ? SeatStatus.VIP : SeatStatus.Available
            };
        }).ToList();
        db.Seats.AddRange(seats);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return seats.Select(s => new SeatDto { SeatId = s.SeatId, EventId = eventId, SeatNumber = s.SeatNumber,
            Row = s.Row, Column = s.Column, Status = s.Status }).ToList();
    }
    public async Task<int> GenerateParkingAsync(int eventId, GenerateParkingLayoutDto dto)
    {
        await using var transaction = await db.BeginReservationTransactionAsync();
        if (!await db.Events.AnyAsync(e => e.EventId == eventId)) throw new KeyNotFoundException("Event not found.");
        if (dto.Count < 1 || dto.Count > 10000 || dto.Fee < 0 || !Enum.IsDefined(dto.VehicleType) || string.IsNullOrWhiteSpace(dto.Zone) || dto.Zone.Length > 20)
            throw new ArgumentException("Supply 1–10000 slots, a valid vehicle type, nonnegative fee and a zone of up to 20 characters.");
        if (await db.ParkingSlots.AnyAsync(s => s.EventId == eventId && s.Zone == dto.Zone)) throw new InvalidOperationException("This zone already exists. Use a different zone.");
        db.ParkingSlots.AddRange(Enumerable.Range(1, dto.Count).Select(i => new ParkingSlot { EventId = eventId,
            SlotNumber = $"{dto.Zone}-{i}", Zone = dto.Zone, VehicleType = dto.VehicleType, Fee = dto.Fee, Status = ParkingSlotStatus.Available }));
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return dto.Count;
    }
}
