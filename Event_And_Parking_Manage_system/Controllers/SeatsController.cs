using Event_And_Parking_Manage_system.DTOs.Seats;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/events/{eventId}/seats")]
    public class SeatsController : ControllerBase
    {
        private readonly ISeatService _seatService;

        public SeatsController(ISeatService seatService)
        {
            _seatService = seatService;
        }

        // ==========================================
        // GET: api/events/{eventId}/seats
        // Get all seats for an event
        // ==========================================

        [HttpGet]
        public async Task<IActionResult> GetSeats(int eventId)
        {
            try
            {
                var seats = await _seatService
                    .GetSeatsByEventIdAsync(eventId);

                return Ok(seats);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
        }

        // ==========================================
        // GET: api/events/{eventId}/seats/{seatId}
        // Get a single seat
        // ==========================================

        [HttpGet("{seatId:int}")]
        public async Task<IActionResult> GetSeat(
            int eventId,
            int seatId)
        {
            var seat = await _seatService
                .GetByIdAsync(seatId);

            if (seat == null || seat.EventId != eventId)
            {
                return NotFound(new
                {
                    message = "Seat not found."
                });
            }

            return Ok(seat);
        }

        // ==========================================
        // POST: api/events/{eventId}/seats
        // Create a new seat
        // Administrator only
        // ==========================================

        [Authorize(Roles = "Administrator")]
        [HttpPost]
        public async Task<IActionResult> CreateSeat(
            int eventId,
            [FromBody] CreateSeatDto dto)
        {
            try
            {
                var seat = await _seatService
                    .CreateAsync(eventId, dto);

                return CreatedAtAction(
                    nameof(GetSeat),
                    new
                    {
                        eventId,
                        seatId = seat.SeatId
                    },
                    seat);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
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
        // PUT: api/events/{eventId}/seats/{seatId}
        // Update an existing seat
        // Administrator only
        // ==========================================

        [Authorize(Roles = "Administrator")]
        [HttpPut("{seatId:int}")]
        public async Task<IActionResult> UpdateSeat(
            int eventId,
            int seatId,
            [FromBody] UpdateSeatDto dto)
        {
            try
            {
                var seat = await _seatService
                    .UpdateAsync(
                        eventId,
                        seatId,
                        dto);

                if (seat == null)
                {
                    return NotFound(new
                    {
                        message = "Seat not found."
                    });
                }

                return Ok(seat);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
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
        // DELETE: api/events/{eventId}/seats/{seatId}
        // Delete a seat
        // Administrator only
        // ==========================================

        [Authorize(Roles = "Administrator")]
        [HttpDelete("{seatId:int}")]
        public async Task<IActionResult> DeleteSeat(
            int eventId,
            int seatId)
        {
            try
            {
                var deleted = await _seatService
                    .DeleteAsync(
                        eventId,
                        seatId);

                if (!deleted)
                {
                    return NotFound(new
                    {
                        message = "Seat not found."
                    });
                }

                return Ok(new
                {
                    message = "Seat deleted successfully."
                });
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
        // POST: api/bookings/{bookingId}/seats
        // Assign seats to booking
        // Customer only
        // ==========================================

        [Authorize(Roles = "Customer")]
        [HttpPost("~/api/bookings/{bookingId:int}/seats")]
        public async Task<IActionResult> AssignSeats(
            int bookingId,
            [FromBody] AssignSeatDto dto)
        {
            var customerIdClaim =
                User.FindFirst("CustomerId")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(
                    customerIdClaim,
                    out var customerId))
            {
                return Unauthorized(new
                {
                    message = "Invalid customer identity."
                });
            }

            try
            {
                var result = await _seatService
                    .AssignSeatsAsync(
                        bookingId,
                        customerId,
                        dto);

                if (!result)
                {
                    return NotFound(new
                    {
                        message = "Booking or seats not found."
                    });
                }

                return Ok(new
                {
                    message = "Seats assigned successfully."
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
            catch (ArgumentException ex)
            {
                return BadRequest(new
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
    }
}