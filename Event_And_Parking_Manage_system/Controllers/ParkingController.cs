using Event_And_Parking_Manage_system.DTOs.Parking;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/events/{eventId}/parking-slots")]
    public class ParkingController : ControllerBase
    {
        private readonly IParkingService _parkingService;

        public ParkingController(IParkingService parkingService)
        {
            _parkingService = parkingService;
        }

        // ==========================================
        // Get all parking slots for an event
        // GET: api/events/{eventId}/parking-slots
        // ==========================================

        [HttpGet]
        public async Task<IActionResult> GetParkingSlots(int eventId)
        {
            var slots = await _parkingService
                .GetSlotsByEventIdAsync(eventId);

            return Ok(slots);
        }

        // ==========================================
        // Get available parking slots by vehicle type
        // GET: api/events/{eventId}/parking-slots/available?vehicleType=Car
        // ==========================================

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableParkingSlots(
            int eventId,
            [FromQuery] VehicleType vehicleType)
        {
            try
            {
                var slots = await _parkingService
                    .GetAvailableSlotsByEventAndVehicleTypeAsync(
                        eventId,
                        vehicleType);

                return Ok(slots);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // ==========================================
        // Get single parking slot
        // GET: api/events/{eventId}/parking-slots/{slotId}
        // ==========================================

        [HttpGet("{slotId:int}")]
        public async Task<IActionResult> GetParkingSlot(
            int eventId,
            int slotId)
        {
            var slot = await _parkingService
                .GetByIdAsync(slotId);

            if (slot == null || slot.EventId != eventId)
            {
                return NotFound(new
                {
                    message = "Parking slot not found."
                });
            }

            return Ok(slot);
        }

        // ==========================================
        // Create parking slot
        // POST: api/events/{eventId}/parking-slots
        // ==========================================

        [Authorize(Roles = "Administrator")]
        [HttpPost]
        public async Task<IActionResult> CreateParkingSlot(
            int eventId,
            [FromBody] CreateParkingSlotDto dto)
        {
            try
            {
                var slot = await _parkingService
                    .CreateAsync(eventId, dto);

                return CreatedAtAction(
                    nameof(GetParkingSlot),
                    new
                    {
                        eventId,
                        slotId = slot.ParkingSlotId
                    },
                    slot);
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
        // Update parking slot
        // PUT: api/events/{eventId}/parking-slots/{slotId}
        // ==========================================

        [Authorize(Roles = "Administrator")]
        [HttpPut("{slotId:int}")]
        public async Task<IActionResult> UpdateParkingSlot(
            int eventId,
            int slotId,
            [FromBody] UpdateParkingSlotDto dto)
        {
            try
            {
                var slot = await _parkingService.UpdateAsync(
                    eventId,
                    slotId,
                    dto);

                if (slot == null)
                {
                    return NotFound(new
                    {
                        message = "Parking slot not found."
                    });
                }

                return Ok(slot);
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
        // Delete parking slot
        // DELETE: api/events/{eventId}/parking-slots/{slotId}
        // ==========================================

        [Authorize(Roles = "Administrator")]
        [HttpDelete("{slotId:int}")]
        public async Task<IActionResult> DeleteParkingSlot(
            int eventId,
            int slotId)
        {
            try
            {
                var deleted = await _parkingService
                    .DeleteAsync(eventId, slotId);

                if (!deleted)
                {
                    return NotFound(new
                    {
                        message = "Parking slot not found."
                    });
                }

                return Ok(new
                {
                    message = "Parking slot deleted successfully."
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
        // Assign parking to booking
        // POST: api/bookings/{bookingId}/parking
        // ==========================================

        [Authorize]
        [HttpPost("~/api/bookings/{bookingId:int}/parking")]
        public async Task<IActionResult> AssignParking(
            int bookingId,
            [FromBody] AssignParkingDto dto)
        {
            var customerIdClaim = User.FindFirst("CustomerId")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(customerIdClaim, out var customerId))
            {
                return Unauthorized(new
                {
                    message = "Invalid customer identity."
                });
            }

            try
            {
                var result = await _parkingService
                    .AssignParkingAsync(
                        bookingId,
                        customerId,
                        dto);

                if (!result)
                {
                    return NotFound(new
                    {
                        message = "Booking or parking slot not found."
                    });
                }

                return Ok(new
                {
                    message = "Parking assigned successfully."
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

        // ==========================================
        // Remove parking from booking
        // DELETE: api/bookings/{bookingId}/parking
        // ==========================================

        [Authorize]
        [HttpDelete("~/api/bookings/{bookingId:int}/parking")]
        public async Task<IActionResult> RemoveParking(
            int bookingId)
        {
            var customerIdClaim = User.FindFirst("CustomerId")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(customerIdClaim, out var customerId))
            {
                return Unauthorized(new
                {
                    message = "Invalid customer identity."
                });
            }

            try
            {
                var result = await _parkingService
                    .RemoveParkingAsync(
                        bookingId,
                        customerId);

                if (!result)
                {
                    return NotFound(new
                    {
                        message = "Booking or parking reservation not found."
                    });
                }

                return Ok(new
                {
                    message = "Parking removed successfully."
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
    }
}