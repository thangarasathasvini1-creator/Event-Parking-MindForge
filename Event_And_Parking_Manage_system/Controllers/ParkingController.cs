using Event_And_Parking_Manage_system.DTOs.Parking;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        // GET: api/events/{eventId}/parking-slots
        [HttpGet]
        public async Task<IActionResult> GetParkingSlots(
            int eventId)
        {
            var slots = await _parkingService
                .GetSlotsByEventIdAsync(eventId);

            return Ok(slots);
        }

        // GET: api/events/{eventId}/parking-slots/{slotId}
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

        // POST: api/events/{eventId}/parking-slots
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

        // PUT: api/events/{eventId}/parking-slots/{slotId}
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

        // DELETE: api/events/{eventId}/parking-slots/{slotId}
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
    }
}