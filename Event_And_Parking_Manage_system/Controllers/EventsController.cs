using Event_And_Parking_Manage_system.DTOs.Events;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? name,
            [FromQuery] int? categoryId,
            [FromQuery] int? venueId,
            [FromQuery] DateTime? eventDate)
        {
            if (!string.IsNullOrWhiteSpace(name) ||
                categoryId.HasValue ||
                venueId.HasValue ||
                eventDate.HasValue)
            {
                var filteredEvents = await _eventService.SearchAsync(
                    name,
                    categoryId,
                    venueId,
                    eventDate);

                return Ok(filteredEvents);
            }

            var events = await _eventService.GetAllAsync();
            return Ok(events);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var eventDetails = await _eventService.GetByIdAsync(id);

            if (eventDetails == null)
                return NotFound(new { message = "Event not found." });

            return Ok(eventDetails);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateEventDto dto)
        {
            try
            {
                var eventDetails = await _eventService.CreateAsync(dto);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = eventDetails.EventId },
                    eventDetails);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateEventDto dto)
        {
            try
            {
                var updated = await _eventService.UpdateAsync(id, dto);

                if (!updated)
                    return NotFound(new { message = "Event not found." });

                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _eventService.DeleteAsync(id);

            if (!deleted)
                return NotFound(new { message = "Event not found." });

            return NoContent();
        }
    }
}