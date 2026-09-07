using Event_And_Parking_Manage_system.DTOs.Payments;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IBookingService _bookingService;

        public PaymentsController(
            IPaymentService paymentService,
            IBookingService bookingService)
        {
            _paymentService = paymentService;
            _bookingService = bookingService;
        }

        // ==========================================
        // POST: api/bookings/{id}/payment
        // Customer - Process Payment
        // ==========================================

        [Authorize(Roles = "Customer")]
        [HttpPost("bookings/{id:int}/payment")]
        public async Task<IActionResult> ProcessPayment(
            int id,
            [FromBody] CreatePaymentDto dto)
        {
            var customerId = GetCustomerId();

            if (customerId == null)
            {
                return Unauthorized(new
                {
                    message = "Customer identity could not be determined."
                });
            }

            try
            {
                var payment =
                    await _paymentService.ProcessPaymentAsync(
                        customerId.Value,
                        id,
                        dto);

                return Ok(payment);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        // ==========================================
        // GET: api/bookings/{id}/payment
        // Get Booking Payment
        // ==========================================

        [HttpGet("bookings/{id:int}/payment")]
        public async Task<IActionResult> GetBookingPayment(int id)
        {
            var payment =
                await _paymentService
                    .GetPaymentByBookingIdAsync(id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            // Administrator can view any payment
            if (User.IsInRole("Administrator"))
            {
                return Ok(payment);
            }

            var currentCustomerId = GetCustomerId();

            if (currentCustomerId == null)
            {
                return Unauthorized();
            }

            // Check booking ownership
            var bookingCustomerId =
                await _bookingService
                    .GetBookingCustomerIdAsync(id);

            if (bookingCustomerId == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            // Customer can view only own payment
            if (bookingCustomerId.Value != currentCustomerId.Value)
            {
                return Forbid();
            }

            return Ok(payment);
        }

        // ==========================================
        // GET: api/payments/customer/{customerId}
        // Get Customer Payment History
        // ==========================================

        [HttpGet("payments/customer/{customerId:int}")]
        public async Task<IActionResult> GetCustomerPayments(
            int customerId)
        {
            var currentCustomerId = GetCustomerId();

            // Administrator can view any customer's payments
            if (User.IsInRole("Administrator"))
            {
                var adminPayments =
                    await _paymentService
                        .GetCustomerPaymentsAsync(customerId);

                return Ok(adminPayments);
            }

            if (currentCustomerId == null)
            {
                return Unauthorized();
            }

            // Customer can view only own payments
            if (currentCustomerId.Value != customerId)
            {
                return Forbid();
            }

            var payments =
                await _paymentService
                    .GetCustomerPaymentsAsync(customerId);

            return Ok(payments);
        }

        // ==========================================
        // GET: api/payments/{id}/receipt
        // Get Payment Receipt
        // ==========================================

        [HttpGet("payments/{id:int}/receipt")]
        public async Task<IActionResult> GetPaymentReceipt(int id)
        {
            var payment =
                await _paymentService
                    .GetPaymentByIdAsync(id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            // Administrator can view any receipt
            if (User.IsInRole("Administrator"))
            {
                return Ok(payment);
            }

            var currentCustomerId = GetCustomerId();

            if (currentCustomerId == null)
            {
                return Unauthorized();
            }

            // Check booking ownership
            var bookingCustomerId =
                await _bookingService
                    .GetBookingCustomerIdAsync(
                        payment.BookingId);

            if (bookingCustomerId == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            // Customer can view only own receipt
            if (bookingCustomerId.Value != currentCustomerId.Value)
            {
                return Forbid();
            }

            return Ok(payment);
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