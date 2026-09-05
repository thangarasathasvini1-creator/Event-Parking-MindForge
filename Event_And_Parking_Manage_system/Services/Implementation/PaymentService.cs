using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Payments;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services.Implementation
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ApplicationDbContext _context;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IBookingRepository bookingRepository,
            ApplicationDbContext context)
        {
            _paymentRepository = paymentRepository;
            _bookingRepository = bookingRepository;
            _context = context;
        }

        public async Task<PaymentDto> ProcessPaymentAsync(
            int customerId,
            int bookingId,
            CreatePaymentDto dto)
        {
            // 1. Get booking
            var booking =
                await _bookingRepository.GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found.");
            }

            // 2. Check ownership
            if (booking.CustomerId != customerId)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to make payment for this booking.");
            }

            // 3. Validate payment method
            if (string.IsNullOrWhiteSpace(dto.PaymentMethod))
            {
                throw new InvalidOperationException(
                    "Payment method is required.");
            }

            // 4. Check existing payment
            var existingPayment =
                await _paymentRepository
                    .GetByBookingIdAsync(bookingId);

            // 5. Idempotency
            if (existingPayment != null &&
                existingPayment.Status == PaymentStatus.Completed)
            {
                return MapToDto(existingPayment);
            }

            // 6. Booking must be pending
            if (booking.Status != BookingStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Payment is only allowed for pending bookings.");
            }

            // 7. Check hold expiry
            if (booking.HoldExpiresAt.HasValue &&
                booking.HoldExpiresAt.Value <= DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "Booking hold has expired.");
            }

            // 8. Mock payment processing
            var paymentStatus =
                dto.SimulateSuccess
                    ? PaymentStatus.Completed
                    : PaymentStatus.Failed;

            // 9. Existing failed payment retry
            if (existingPayment != null &&
                existingPayment.Status == PaymentStatus.Failed)
            {
                existingPayment.Status = paymentStatus;

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

                if (paymentStatus == PaymentStatus.Completed)
                {
                    booking.Status =
                        BookingStatus.Confirmed;
                }

                await using var retryTransaction =
                    await _context.Database
                        .BeginTransactionAsync();

                try
                {
                    await _paymentRepository
                        .UpdateAsync(existingPayment);

                    await _bookingRepository
                        .UpdateAsync(booking);

                    await _context.SaveChangesAsync();

                    await retryTransaction.CommitAsync();
                }
                catch
                {
                    await retryTransaction.RollbackAsync();
                    throw;
                }

                return MapToDto(existingPayment);
            }

            // 10. Create new payment
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

            // 11. Confirm booking only after successful payment
            if (paymentStatus == PaymentStatus.Completed)
            {
                booking.Status =
                    BookingStatus.Confirmed;
            }

            booking.UpdatedAt =
                DateTime.UtcNow;

            // 12. Save payment and booking together
            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                await _paymentRepository
                    .AddAsync(payment);

                await _bookingRepository
                    .UpdateAsync(booking);

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            // 13. Return payment
            return MapToDto(payment);
        }

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

        public async Task<List<PaymentDto>>
            GetCustomerPaymentsAsync(int customerId)
        {
            var payments =
                await _paymentRepository
                    .GetByCustomerIdAsync(customerId);

            return payments
                .Select(MapToDto)
                .ToList();
        }

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