using Event_And_Parking_Manage_system.DTOs.Bookings;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        // ==========================================
        // POST: api/bookings
        // Customer - Create a new booking
        // ==========================================

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> CreateBooking(
            [FromBody] CreateBookingDto dto)
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
                var booking =
                    await _bookingService.CreateBookingAsync(
                        customerId.Value,
                        dto);

                return CreatedAtAction(
                    nameof(GetBookingById),
                    new { id = booking.BookingId },
                    booking);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
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
        // GET: api/bookings/{id}
        // Get booking details
        // ==========================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetBookingById(int id)
        {
            var booking =
                await _bookingService.GetBookingByIdAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            var customerId = GetCustomerId();

            // Administrator can view any booking
            if (User.IsInRole("Administrator"))
            {
                return Ok(booking);
            }

            // Customer can view only their own booking
            if (customerId == null ||
                booking.CustomerId != customerId.Value)
            {
                return Forbid();
            }

            return Ok(booking);
        }

        // ==========================================
        // GET: api/bookings/customer/{customerId}
        // Customer booking history
        // ==========================================

        [HttpGet("customer/{customerId:int}")]
        public async Task<IActionResult> GetCustomerBookingHistory(
            int customerId)
        {
            var currentCustomerId = GetCustomerId();

            // Administrator can view any customer's booking history
            if (User.IsInRole("Administrator"))
            {
                var adminBookings =
                    await _bookingService
                        .GetCustomerBookingHistoryAsync(customerId);

                return Ok(adminBookings);
            }

            if (currentCustomerId == null)
            {
                return Unauthorized(new
                {
                    message = "Customer identity could not be determined."
                });
            }

            // Customer can view only their own history
            if (currentCustomerId.Value != customerId)
            {
                return Forbid();
            }

            var bookings =
                await _bookingService
                    .GetCustomerBookingHistoryAsync(customerId);

            return Ok(bookings);
        }

        // ==========================================
        // DELETE: api/bookings/{id}
        // Customer - Cancel booking
        // ==========================================

        [Authorize(Roles = "Customer,Administrator")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> CancelBooking(
            int id,
            [FromBody] CancelBookingDto? dto)
        {
            var customerId = GetCustomerId();

            if (User.IsInRole("Administrator"))
            {
                var targetBooking =
                    await _bookingService.GetBookingByIdAsync(id);

                if (targetBooking != null)
                {
                    customerId = targetBooking.CustomerId;
                }
            }

            if (customerId == null)
            {
                return Unauthorized(new
                {
                    message = "Customer identity could not be determined."
                });
            }

            try
            {
                var result =
                    await _bookingService.CancelBookingAsync(
                        id,
                        customerId.Value,
                        dto);

                if (!result)
                {
                    return NotFound(new
                    {
                        message = "Booking not found."
                    });
                }

                return Ok(new
                {
                    message = "Booking cancelled successfully."
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
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
        // GET: api/bookings?eventId={eventId}
        // Administrator - Get bookings by event
        // ==========================================

        [HttpGet]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetBookingsByEvent(
            [FromQuery] int eventId)
        {
            if (eventId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid eventId is required."
                });
            }

            var bookings =
                await _bookingService
                    .GetBookingsByEventAsync(eventId);

            return Ok(bookings);
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