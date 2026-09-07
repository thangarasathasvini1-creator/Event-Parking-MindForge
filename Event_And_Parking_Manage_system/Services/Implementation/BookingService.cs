using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Bookings;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IEventRepository _eventRepository;
        private readonly ISeatRepository _seatRepository;
        private readonly IParkingRepository _parkingRepository;
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ILogger<BookingService> _logger;

        public BookingService(
            IBookingRepository bookingRepository,
            IEventRepository eventRepository,
            ISeatRepository seatRepository,
            IParkingRepository parkingRepository,
            ApplicationDbContext context,
            INotificationService notificationService,
            ILogger<BookingService> logger)
        {
            _bookingRepository = bookingRepository;
            _eventRepository = eventRepository;
            _seatRepository = seatRepository;
            _parkingRepository = parkingRepository;
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        // =========================================================
        // CREATE BOOKING
        // =========================================================

        public async Task<BookingDto> CreateBookingAsync(
            int customerId,
            CreateBookingDto dto)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                // =================================================
                // 1. Check Event
                // =================================================

                var eventEntity =
                    await _eventRepository.GetByIdAsync(dto.EventId);

                if (eventEntity == null)
                {
                    throw new KeyNotFoundException(
                        "Event not found.");
                }

                // =================================================
                // 2. Validate Seats
                // =================================================

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

                    // ---------------------------------------------
                    // Seat exists
                    // ---------------------------------------------

                    if (seat == null)
                    {
                        throw new KeyNotFoundException(
                            $"Seat {seatId} not found.");
                    }

                    // ---------------------------------------------
                    // Seat belongs to selected event
                    // ---------------------------------------------

                    if (seat.EventId != dto.EventId)
                    {
                        throw new InvalidOperationException(
                            $"Seat {seatId} does not belong to the selected event.");
                    }

                    // ---------------------------------------------
                    // Seat must be Available
                    // ---------------------------------------------

                    if (seat.Status != SeatStatus.Available)
                    {
                        throw new InvalidOperationException(
                            $"Seat {seat.SeatNumber} is not available.");
                    }

                    // ---------------------------------------------
                    // Check active booking
                    // ---------------------------------------------

                    var alreadyBooked =
                        await _bookingRepository
                            .HasActiveSeatBookingAsync(
                                seatId,
                                dto.EventId);

                    if (alreadyBooked)
                    {
                        throw new InvalidOperationException(
                            $"Seat {seat.SeatNumber} is already booked.");
                    }

                    seats.Add(seat);
                }

                // =================================================
                // 3. Validate Optional Parking
                // =================================================

                ParkingSlot? parkingSlot = null;

                if (dto.ParkingSlotId.HasValue)
                {
                    parkingSlot =
                        await _parkingRepository.GetByIdAsync(
                            dto.ParkingSlotId.Value);

                    // ---------------------------------------------
                    // Parking slot exists
                    // ---------------------------------------------

                    if (parkingSlot == null)
                    {
                        throw new KeyNotFoundException(
                            "Parking slot not found.");
                    }

                    // ---------------------------------------------
                    // Parking belongs to selected event
                    // ---------------------------------------------

                    if (parkingSlot.EventId != dto.EventId)
                    {
                        throw new InvalidOperationException(
                            "Parking slot does not belong to the selected event.");
                    }

                    // ---------------------------------------------
                    // Parking must be Available
                    // ---------------------------------------------

                    if (parkingSlot.Status !=
                        ParkingSlotStatus.Available)
                    {
                        throw new InvalidOperationException(
                            $"Parking slot {parkingSlot.SlotNumber} is not available.");
                    }

                    // ---------------------------------------------
                    // Check active reservation
                    // ---------------------------------------------

                    var alreadyReserved =
                        await _bookingRepository
                            .HasActiveParkingReservationAsync(
                                dto.ParkingSlotId.Value,
                                dto.EventId);

                    if (alreadyReserved)
                    {
                        throw new InvalidOperationException(
                            $"Parking slot {parkingSlot.SlotNumber} is already reserved.");
                    }
                }

                // =================================================
                // 4. Calculate Total Amount on Server
                // =================================================

                var seatAmount =
                    eventEntity.TicketPrice * seats.Count;

                var parkingAmount =
                    parkingSlot?.Fee ?? 0m;

                var totalAmount =
                    seatAmount + parkingAmount;

                // =================================================
                // 5. Create Booking
                // =================================================

                var now = DateTime.UtcNow;

                var booking = new Booking
                {
                    BookingNumber =
                        GenerateBookingNumber(),

                    CustomerId =
                        customerId,

                    EventId =
                        dto.EventId,

                    Status =
                        BookingStatus.Pending,

                    TotalAmount =
                        totalAmount,

                    HoldExpiresAt =
                        now.AddMinutes(10),

                    CreatedAt =
                        now
                };

                // =================================================
                // 6. Add Selected Seats + HOLD Seats
                // =================================================

                foreach (var seat in seats)
                {
                    // Create BookingSeat relationship
                    booking.BookingSeats.Add(
                        new BookingSeat
                        {
                            SeatId =
                                seat.SeatId,

                            CreatedAt =
                                now
                        });

                    // Hold seat
                    seat.Status =
                        SeatStatus.Held;

                    seat.UpdatedAt =
                        now;
                }

                // =================================================
                // 7. Add Optional Parking + HOLD Parking
                // =================================================

                if (parkingSlot != null)
                {
                    booking.ParkingReservation =
                        new ParkingReservation
                        {
                            ParkingSlotId =
                                parkingSlot.ParkingSlotId,

                            // Store fee at reservation time
                            ReservedFee =
                                parkingSlot.Fee,

                            CreatedAt =
                                now
                        };

                    // Hold parking slot
                    parkingSlot.Status =
                        ParkingSlotStatus.Held;

                    parkingSlot.UpdatedAt =
                        now;
                }

                // =================================================
                // 8. Save Booking + Related Data
                // =================================================

                await _bookingRepository.AddAsync(booking);

                await _context.SaveChangesAsync();

                // =================================================
                // 9. Commit Transaction
                // =================================================

                await transaction.CommitAsync();

                // =================================================
                // 10. Return DTO
                // =================================================

                return MapToDto(booking);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();

                _logger.LogWarning(
                    ex,
                    "Concurrency conflict while creating booking for customer {CustomerId}.",
                    customerId);

                throw new InvalidOperationException(
                    "The selected seat or parking slot was just taken by another customer. Please refresh and try again.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // GET BOOKING BY ID
        // =========================================================

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

        // =========================================================
        // CUSTOMER BOOKING HISTORY
        // =========================================================

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

        // =========================================================
        // CANCEL BOOKING
        // =========================================================

        public async Task<bool> CancelBookingAsync(
            int bookingId,
            int customerId,
            CancelBookingDto? dto)
        {
            Booking? booking = null;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                // =================================================
                // 1. Get Booking
                // =================================================

                booking =
                    await _bookingRepository.GetByIdAsync(
                        bookingId);

                if (booking == null)
                {
                    throw new KeyNotFoundException(
                        "Booking not found.");
                }

                // =================================================
                // 2. Check Ownership
                // =================================================

                if (booking.CustomerId != customerId)
                {
                    throw new UnauthorizedAccessException(
                        "You are not allowed to cancel this booking.");
                }

                // =================================================
                // 3. Already Cancelled
                // =================================================

                if (booking.Status == BookingStatus.Cancelled)
                {
                    throw new InvalidOperationException(
                        "Booking is already cancelled.");
                }

                // =================================================
                // 4. Expired Booking
                // =================================================

                if (booking.Status == BookingStatus.Expired)
                {
                    throw new InvalidOperationException(
                        "Expired booking cannot be cancelled.");
                }

                // =================================================
                // 5. Confirmed Booking
                // =================================================

                if (booking.Status == BookingStatus.Confirmed)
                {
                    throw new InvalidOperationException(
                        "Confirmed booking cannot be cancelled.");
                }

                // =================================================
                // 6. Release Seats
                // =================================================

                foreach (var bookingSeat in booking.BookingSeats)
                {
                    if (bookingSeat.Seat != null &&
                        bookingSeat.Seat.Status ==
                        SeatStatus.Held)
                    {
                        bookingSeat.Seat.Status =
                            SeatStatus.Available;

                        bookingSeat.Seat.UpdatedAt =
                            DateTime.UtcNow;
                    }
                }

                // =================================================
                // 7. Release Parking
                // =================================================

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
                            DateTime.UtcNow;
                    }
                }

                // =================================================
                // 8. Cancel Booking
                // =================================================

                booking.Status =
                    BookingStatus.Cancelled;

                booking.UpdatedAt =
                    DateTime.UtcNow;

                // =================================================
                // 9. Save Everything Together
                // =================================================

                await _bookingRepository.UpdateAsync(
                    booking);

                await _context.SaveChangesAsync();

                // =================================================
                // 10. Commit Transaction
                // =================================================

                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();

                _logger.LogWarning(
                    ex,
                    "Concurrency conflict while cancelling booking {BookingId}.",
                    bookingId);

                throw new InvalidOperationException(
                    "The booking or one of its reserved resources was modified by another request. Please refresh and try again.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            // =====================================================
            // 11. Create Cancellation Notification
            // =====================================================

            if (booking != null)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        booking.CustomerId,
                        "BookingCancelled",
                        $"Your booking {booking.BookingNumber} has been cancelled successfully.");
                }
                catch (Exception ex)
                {
                    // Booking is already successfully cancelled.
                    // Notification failure must not undo the booking.
                    _logger.LogError(
                        ex,
                        "Booking {BookingId} was cancelled successfully, but cancellation notification failed.",
                        booking.BookingId);
                }
            }

            return true;
        }

        // =========================================================
        // GET BOOKINGS BY EVENT
        // =========================================================

        public async Task<List<BookingDto>>
            GetBookingsByEventAsync(
                int eventId)
        {
            var bookings =
                await _bookingRepository
                    .GetByEventIdAsync(eventId);

            return bookings
                .Select(MapToDto)
                .ToList();
        }

        // =========================================================
        // GET BOOKING CUSTOMER ID
        // =========================================================

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

        // =========================================================
        // GENERATE BOOKING NUMBER
        // =========================================================

        private static string GenerateBookingNumber()
        {
            return $"BK-{DateTime.UtcNow:yyyyMMddHHmmss}-" +
                   $"{Guid.NewGuid():N}"
                       .ToUpperInvariant();
        }

        // =========================================================
        // BOOKING DTO MAPPING
        // =========================================================

        private static BookingDto MapToDto(
            Booking booking)
        {
            return new BookingDto
            {
                BookingId =
                    booking.BookingId,

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

        // =========================================================
        // BOOKING DETAILS DTO MAPPING
        // =========================================================

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

        // =========================================================
        // BOOKING HISTORY DTO MAPPING
        // =========================================================

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