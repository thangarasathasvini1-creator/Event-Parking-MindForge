using Event_And_Parking_Manage_system.DTOs.Seats;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        // GET: api/events/{eventId}/seats
        [HttpGet]
        public async Task<IActionResult> GetSeats(int eventId)
        {
            var seats = await _seatService
                .GetSeatsByEventIdAsync(eventId);

            return Ok(seats);
        }

        // GET: api/events/{eventId}/seats/{seatId}
        [HttpGet("{seatId:int}")]
        public async Task<IActionResult> GetSeat(
            int eventId,
            int seatId)
        {
            var seat = await _seatService.GetByIdAsync(seatId);

            if (seat == null || seat.EventId != eventId)
            {
                return NotFound(new
                {
                    message = "Seat not found."
                });
            }

            return Ok(seat);
        }

        // POST: api/events/{eventId}/seats
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

        // PUT: api/events/{eventId}/seats/{seatId}
        [Authorize(Roles = "Administrator")]
        [HttpPut("{seatId:int}")]
        public async Task<IActionResult> UpdateSeat(
            int eventId,
            int seatId,
            [FromBody] UpdateSeatDto dto)
        {
            try
            {
                var seat = await _seatService.UpdateAsync(
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

        // DELETE: api/events/{eventId}/seats/{seatId}
        [Authorize(Roles = "Administrator")]
        [HttpDelete("{seatId:int}")]
        public async Task<IActionResult> DeleteSeat(
            int eventId,
            int seatId)
        {
            try
            {
                var deleted = await _seatService.DeleteAsync(
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