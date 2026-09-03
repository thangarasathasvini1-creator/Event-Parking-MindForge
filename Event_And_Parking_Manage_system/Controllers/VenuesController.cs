using Event_And_Parking_Manage_system.DTOs.Venues;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/venues")]
    public class VenuesController : ControllerBase
    {
        private readonly IVenueService _venueService;

        public VenuesController(IVenueService venueService)
        {
            _venueService = venueService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var venues = await _venueService.GetAllAsync();
            return Ok(venues);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var venue = await _venueService.GetByIdAsync(id);

            if (venue == null)
                return NotFound(new { message = "Venue not found." });

            return Ok(venue);
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable(
            [FromQuery] DateTime eventDate,
            [FromQuery] TimeSpan startTime,
            [FromQuery] TimeSpan endTime)
        {
            if (startTime >= endTime)
            {
                return BadRequest(new
                {
                    message = "Start time must be earlier than end time."
                });
            }

            var venues = await _venueService.GetAvailableAsync(
                eventDate,
                startTime,
                endTime);

            return Ok(venues);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateVenueDto dto)
        {
            try
            {
                var venue = await _venueService.CreateAsync(dto);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = venue.VenueId },
                    venue);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateVenueDto dto)
        {
            try
            {
                var updated = await _venueService.UpdateAsync(id, dto);

                if (!updated)
                    return NotFound(new { message = "Venue not found." });

                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _venueService.DeleteAsync(id);

            if (!deleted)
                return NotFound(new { message = "Venue not found." });

            return NoContent();
        }
    }
}