using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Payments;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly INotificationService _notificationService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IBookingRepository bookingRepository,
            INotificationService notificationService,
            ApplicationDbContext context,
            ILogger<PaymentService> logger)
        {
            _paymentRepository = paymentRepository;
            _bookingRepository = bookingRepository;
            _notificationService = notificationService;
            _context = context;
            _logger = logger;
        }

        // =========================================================
        // PROCESS PAYMENT
        // =========================================================

        public async Task<PaymentDto> ProcessPaymentAsync(
            int customerId,
            int bookingId,
            CreatePaymentDto dto)
        {
            if (dto == null)
            {
                throw new InvalidOperationException(
                    "Payment data is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.PaymentMethod))
            {
                throw new InvalidOperationException(
                    "Payment method is required.");
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                // =================================================
                // 1. Get Booking
                // =================================================

                var booking =
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
                        "You are not allowed to make payment for this booking.");
                }

                // =================================================
                // 3. Get Existing Payment
                // =================================================

                var existingPayment =
                    await _paymentRepository
                        .GetByBookingIdAsync(bookingId);

                // =================================================
                // 4. Idempotency
                // =================================================

                if (existingPayment != null &&
                    existingPayment.Status == PaymentStatus.Completed)
                {
                    await transaction.CommitAsync();

                    return MapToDto(existingPayment);
                }

                // =================================================
                // 5. Booking Must Be Pending
                // =================================================

                if (booking.Status != BookingStatus.Pending)
                {
                    throw new InvalidOperationException(
                        "Payment is only allowed for pending bookings.");
                }

                // =================================================
                // 6. Check Hold Expiry
                // =================================================

                if (booking.HoldExpiresAt.HasValue &&
                    booking.HoldExpiresAt.Value <= DateTime.UtcNow)
                {
                    throw new InvalidOperationException(
                        "Booking hold has expired.");
                }

                // =================================================
                // 7. Mock Payment Processing
                // =================================================

                var paymentStatus =
                    dto.SimulateSuccess
                        ? PaymentStatus.Completed
                        : PaymentStatus.Failed;

                // =================================================
                // 8. Existing Failed Payment Retry
                // =================================================

                if (existingPayment != null &&
                    existingPayment.Status == PaymentStatus.Failed)
                {
                    existingPayment.Status =
                        paymentStatus;

                    existingPayment.PaymentMethod =
                        dto.PaymentMethod.Trim();

                    existingPayment.TransactionReference =
                        $"TXN-{Guid.NewGuid():N}"
                            .ToUpperInvariant();

                    existingPayment.PaidAt =
                        paymentStatus == PaymentStatus.Completed
                            ? DateTime.UtcNow
                            : null;

                    booking.UpdatedAt =
                        DateTime.UtcNow;

                    // ---------------------------------------------
                    // Successful retry
                    // ---------------------------------------------

                    if (paymentStatus ==
                        PaymentStatus.Completed)
                    {
                        booking.Status =
                            BookingStatus.Confirmed;

                        SetResourcesAsBooked(booking);
                    }

                    // ---------------------------------------------
                    // Save payment + booking + resources
                    // ---------------------------------------------

                    await _paymentRepository
                        .UpdateAsync(existingPayment);

                    await _bookingRepository
                        .UpdateAsync(booking);

                    await _context.SaveChangesAsync();

                    // ---------------------------------------------
                    // Commit transaction
                    // ---------------------------------------------

                    await transaction.CommitAsync();

                    // ---------------------------------------------
                    // Notifications after successful commit
                    // ---------------------------------------------

                    if (paymentStatus ==
                        PaymentStatus.Completed)
                    {
                        await SendPaymentSuccessNotificationsAsync(
                            booking.CustomerId,
                            booking.BookingNumber);
                    }

                    return MapToDto(existingPayment);
                }

                // =================================================
                // 9. Create New Payment
                // =================================================

                var payment = new Payment
                {
                    BookingId =
                        booking.BookingId,

                    Amount =
                        booking.TotalAmount,

                    Status =
                        paymentStatus,

                    PaymentMethod =
                        dto.PaymentMethod.Trim(),

                    TransactionReference =
                        $"TXN-{Guid.NewGuid():N}"
                            .ToUpperInvariant(),

                    PaidAt =
                        paymentStatus == PaymentStatus.Completed
                            ? DateTime.UtcNow
                            : null,

                    CreatedAt =
                        DateTime.UtcNow
                };

                // =================================================
                // 10. Confirm Booking After Successful Payment
                // =================================================

                if (paymentStatus ==
                    PaymentStatus.Completed)
                {
                    booking.Status =
                        BookingStatus.Confirmed;

                    SetResourcesAsBooked(booking);
                }

                booking.UpdatedAt =
                    DateTime.UtcNow;

                // =================================================
                // 11. Save Payment + Booking + Resources
                // =================================================

                await _paymentRepository
                    .AddAsync(payment);

                await _bookingRepository
                    .UpdateAsync(booking);

                await _context.SaveChangesAsync();

                // =================================================
                // 12. Commit Transaction
                // =================================================

                await transaction.CommitAsync();

                // =================================================
                // 13. Notifications After Successful Commit
                // =================================================

                if (paymentStatus ==
                    PaymentStatus.Completed)
                {
                    await SendPaymentSuccessNotificationsAsync(
                        booking.CustomerId,
                        booking.BookingNumber);
                }

                // =================================================
                // 14. Return Payment
                // =================================================

                return MapToDto(payment);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();

                _logger.LogWarning(
                    ex,
                    "Concurrency conflict while processing payment for booking {BookingId}.",
                    bookingId);

                throw new InvalidOperationException(
                    "The booking or its resources were modified by another request. Please try again.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // SEND PAYMENT SUCCESS NOTIFICATIONS
        // =========================================================

        private async Task SendPaymentSuccessNotificationsAsync(
            int customerId,
            string bookingNumber)
        {
            try
            {
                // -------------------------------------------------
                // Payment Completed Notification
                // -------------------------------------------------

                await _notificationService
                    .CreateNotificationAsync(
                        customerId,
                        "PaymentCompleted",
                        $"Payment completed successfully for booking {bookingNumber}.");

                // -------------------------------------------------
                // Booking Confirmed Notification
                // -------------------------------------------------

                await _notificationService
                    .CreateNotificationAsync(
                        customerId,
                        "BookingConfirmed",
                        $"Your booking {bookingNumber} has been confirmed successfully.");
            }
            catch (Exception ex)
            {
                // Payment and booking have already been committed.
                // Notification failure must not undo the payment.
                _logger.LogError(
                    ex,
                    "Payment for booking {BookingNumber} was completed successfully, but notification creation failed.",
                    bookingNumber);
            }
        }

        // =========================================================
        // GET PAYMENT BY BOOKING ID
        // =========================================================

        public async Task<PaymentDto?> GetPaymentByBookingIdAsync(
            int bookingId)
        {
            var payment =
                await _paymentRepository
                    .GetByBookingIdAsync(bookingId);

            if (payment == null)
                return null;

            return MapToDto(payment);
        }

        // =========================================================
        // GET CUSTOMER PAYMENTS
        // =========================================================

        public async Task<List<PaymentDto>>
            GetCustomerPaymentsAsync(
                int customerId)
        {
            var payments =
                await _paymentRepository
                    .GetByCustomerIdAsync(customerId);

            return payments
                .Select(MapToDto)
                .ToList();
        }

        // =========================================================
        // GET PAYMENT BY ID
        // =========================================================

        public async Task<PaymentDto?> GetPaymentByIdAsync(
            int paymentId)
        {
            var payment =
                await _paymentRepository
                    .GetByIdAsync(paymentId);

            if (payment == null)
                return null;

            return MapToDto(payment);
        }

        // =========================================================
        // SET BOOKING RESOURCES AS BOOKED
        // =========================================================

        private static void SetResourcesAsBooked(
            Booking booking)
        {
            // -----------------------------------------------------
            // Seats → Booked
            // -----------------------------------------------------

            foreach (var bookingSeat in booking.BookingSeats)
            {
                if (bookingSeat.Seat != null)
                {
                    bookingSeat.Seat.Status =
                        SeatStatus.Booked;

                    bookingSeat.Seat.UpdatedAt =
                        DateTime.UtcNow;
                }
            }

            // -----------------------------------------------------
            // Parking → Occupied
            // -----------------------------------------------------

            if (booking.ParkingReservation?.ParkingSlot != null)
            {
                booking.ParkingReservation.ParkingSlot.Status =
                    ParkingSlotStatus.Occupied;

                booking.ParkingReservation.ParkingSlot.UpdatedAt =
                    DateTime.UtcNow;
            }
        }

        // =========================================================
        // PAYMENT DTO MAPPING
        // =========================================================

        private static PaymentDto MapToDto(
            Payment payment)
        {
            return new PaymentDto
            {
                PaymentId =
                    payment.PaymentId,

                BookingId =
                    payment.BookingId,

                Amount =
                    payment.Amount,

                Status =
                    payment.Status.ToString(),

                PaymentMethod =
                    payment.PaymentMethod,

                TransactionReference =
                    payment.TransactionReference,

                PaidAt =
                    payment.PaidAt,

                CreatedAt =
                    payment.CreatedAt
            };
        }
    }
}