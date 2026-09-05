using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Bookings;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IEventRepository _eventRepository;
        private readonly ISeatRepository _seatRepository;
        private readonly IParkingRepository _parkingRepository;
        private readonly ApplicationDbContext _context;

        public BookingService(
            IBookingRepository bookingRepository,
            IEventRepository eventRepository,
            ISeatRepository seatRepository,
            IParkingRepository parkingRepository,
            ApplicationDbContext context)
        {
            _bookingRepository = bookingRepository;
            _eventRepository = eventRepository;
            _seatRepository = seatRepository;
            _parkingRepository = parkingRepository;
            _context = context;
        }

        public async Task<BookingDto> CreateBookingAsync(
            int customerId,
            CreateBookingDto dto)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    System.Data.IsolationLevel.Serializable);

            try
            {
                // 1. Check event
                var eventEntity =
                    await _eventRepository.GetByIdAsync(dto.EventId);

                if (eventEntity == null)
                    throw new KeyNotFoundException(
                        "Event not found.");

                // 2. Validate seats
                if (dto.SeatIds == null ||
                    dto.SeatIds.Count == 0)
                {
                    throw new InvalidOperationException(
                        "At least one seat must be selected.");
                }

                var distinctSeatIds = dto.SeatIds
                    .Distinct()
                    .ToList();

                if (distinctSeatIds.Count != dto.SeatIds.Count)
                {
                    throw new InvalidOperationException(
                        "Duplicate seat IDs are not allowed.");
                }

                var seats = new List<Seat>();

                foreach (var seatId in distinctSeatIds)
                {
                    var seat =
                        await _seatRepository.GetByIdAsync(
                            seatId);

                    if (seat == null)
                    {
                        throw new KeyNotFoundException(
                            $"Seat {seatId} not found.");
                    }

                    if (seat.EventId != dto.EventId)
                    {
                        throw new InvalidOperationException(
                            $"Seat {seatId} does not belong to the selected event.");
                    }

                    var alreadyBooked =
                        await _bookingRepository
                            .HasActiveSeatBookingAsync(
                                seatId,
                                dto.EventId);

                    if (alreadyBooked)
                    {
                        throw new InvalidOperationException(
                            $"Seat {seatId} is already booked.");
                    }

                    seats.Add(seat);
                }

                // 3. Validate optional parking
                ParkingSlot? parkingSlot = null;

                if (dto.ParkingSlotId.HasValue)
                {
                    parkingSlot =
                        await _parkingRepository.GetByIdAsync(
                            dto.ParkingSlotId.Value);

                    if (parkingSlot == null)
                    {
                        throw new KeyNotFoundException(
                            "Parking slot not found.");
                    }

                    if (parkingSlot.EventId != dto.EventId)
                    {
                        throw new InvalidOperationException(
                            "Parking slot does not belong to the selected event.");
                    }

                    var alreadyReserved =
                        await _bookingRepository
                            .HasActiveParkingReservationAsync(
                                dto.ParkingSlotId.Value,
                                dto.EventId);

                    if (alreadyReserved)
                    {
                        throw new InvalidOperationException(
                            "Parking slot is already reserved.");
                    }
                }

                // 4. Calculate total amount on server
                var seatAmount =
                    eventEntity.TicketPrice * seats.Count;

                var parkingAmount =
                    parkingSlot?.Fee ?? 0m;

                var totalAmount =
                    seatAmount + parkingAmount;

                // 5. Create booking
                var booking = new Booking
                {
                    BookingNumber =
                        GenerateBookingNumber(),

                    CustomerId = customerId,

                    EventId = dto.EventId,

                    Status = BookingStatus.Pending,

                    TotalAmount = totalAmount,

                    HoldExpiresAt =
                        DateTime.UtcNow.AddMinutes(10),

                    CreatedAt = DateTime.UtcNow
                };

                // 6. Add selected seats
                foreach (var seat in seats)
                {
                    booking.BookingSeats.Add(
                        new BookingSeat
                        {
                            SeatId = seat.SeatId,
                            CreatedAt = DateTime.UtcNow
                        });
                }

                // 7. Add optional parking
                if (parkingSlot != null)
                {
                    booking.ParkingReservation =
                        new ParkingReservation
                        {
                            ParkingSlotId =
                                parkingSlot.ParkingSlotId,

                            ReservedFee =
                                parkingSlot.Fee,

                            CreatedAt =
                                DateTime.UtcNow
                        };
                }

                // 8. Save booking and related data
                await _bookingRepository.AddAsync(booking);

                await _context.SaveChangesAsync();

                // 9. Commit transaction
                await transaction.CommitAsync();

                // 10. Return DTO
                return MapToDto(booking);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<BookingDetailsDto?> GetBookingByIdAsync(
            int bookingId)
        {
            var booking =
                await _bookingRepository.GetByIdAsync(
                    bookingId);

            if (booking == null)
                return null;

            return MapToDetailsDto(booking);
        }

        public async Task<List<BookingHistoryDto>>
            GetCustomerBookingHistoryAsync(
                int customerId)
        {
            var bookings =
                await _bookingRepository
                    .GetByCustomerIdAsync(customerId);

            return bookings
                .Select(MapToHistoryDto)
                .ToList();
        }

        public async Task<bool> CancelBookingAsync(
            int bookingId,
            int customerId,
            CancelBookingDto? dto)
        {
            var booking =
                await _bookingRepository.GetByIdAsync(
                    bookingId);

            if (booking == null)
                throw new KeyNotFoundException(
                    "Booking not found.");

            if (booking.CustomerId != customerId)
                throw new UnauthorizedAccessException(
                    "You are not allowed to cancel this booking.");

            if (booking.Status == BookingStatus.Cancelled)
                throw new InvalidOperationException(
                    "Booking is already cancelled.");

            if (booking.Status == BookingStatus.Expired)
                throw new InvalidOperationException(
                    "Expired booking cannot be cancelled.");

            booking.Status = BookingStatus.Cancelled;
            booking.UpdatedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);

            await _bookingRepository.SaveChangesAsync();

            return true;
        }

        public async Task<List<BookingDto>>
            GetBookingsByEventAsync(int eventId)
        {
            var bookings =
                await _bookingRepository
                    .GetByEventIdAsync(eventId);

            return bookings
                .Select(MapToDto)
                .ToList();
        }

        public async Task<int?> GetBookingCustomerIdAsync(
            int bookingId)
        {
            var booking =
                await _bookingRepository.GetByIdAsync(
                    bookingId);

            if (booking == null)
                return null;

            return booking.CustomerId;
        }

        private static string GenerateBookingNumber()
        {
            return $"BK-{DateTime.UtcNow:yyyyMMddHHmmss}-" +
                   $"{Guid.NewGuid():N}"
                       .ToUpperInvariant();
        }

        private static BookingDto MapToDto(
            Booking booking)
        {
            return new BookingDto
            {
                BookingId = booking.BookingId,

                BookingNumber =
                    booking.BookingNumber,

                CustomerId =
                    booking.CustomerId,

                EventId =
                    booking.EventId,

                Status =
                    booking.Status.ToString(),

                TotalAmount =
                    booking.TotalAmount,

                HoldExpiresAt =
                    booking.HoldExpiresAt,

                CreatedAt =
                    booking.CreatedAt,

                UpdatedAt =
                    booking.UpdatedAt,

                SeatIds =
                    booking.BookingSeats
                        .Select(bs => bs.SeatId)
                        .ToList(),

                ParkingSlotId =
                    booking.ParkingReservation
                        ?.ParkingSlotId,

                PaymentStatus =
                    booking.Payment
                        ?.Status.ToString()
            };
        }

        private static BookingDetailsDto MapToDetailsDto(
            Booking booking)
        {
            return new BookingDetailsDto
            {
                BookingId =
                    booking.BookingId,

                BookingNumber =
                    booking.BookingNumber,

                CustomerId =
                    booking.CustomerId,

                EventId =
                    booking.EventId,

                EventName =
                    booking.Event?.Name ??
                    string.Empty,

                Status =
                    booking.Status.ToString(),

                TotalAmount =
                    booking.TotalAmount,

                HoldExpiresAt =
                    booking.HoldExpiresAt,

                CreatedAt =
                    booking.CreatedAt,

                UpdatedAt =
                    booking.UpdatedAt,

                SeatIds =
                    booking.BookingSeats
                        .Select(bs => bs.SeatId)
                        .ToList(),

                ParkingSlotId =
                    booking.ParkingReservation
                        ?.ParkingSlotId,

                ParkingFee =
                    booking.ParkingReservation
                        ?.ReservedFee,

                PaymentStatus =
                    booking.Payment
                        ?.Status.ToString(),

                TransactionReference =
                    booking.Payment
                        ?.TransactionReference
            };
        }

        private static BookingHistoryDto MapToHistoryDto(
            Booking booking)
        {
            return new BookingHistoryDto
            {
                BookingId =
                    booking.BookingId,

                BookingNumber =
                    booking.BookingNumber,

                EventId =
                    booking.EventId,

                EventName =
                    booking.Event?.Name ??
                    string.Empty,

                Status =
                    booking.Status.ToString(),

                TotalAmount =
                    booking.TotalAmount,

                CreatedAt =
                    booking.CreatedAt,

                SeatCount =
                    booking.BookingSeats.Count,

                ParkingSlotId =
                    booking.ParkingReservation
                        ?.ParkingSlotId,

                PaymentStatus =
                    booking.Payment
                        ?.Status.ToString()
            };
        }
    }
}