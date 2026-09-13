using System.Security.Claims;
using Event_And_Parking_Manage_system.DTOs.Bookings;
using Event_And_Parking_Manage_system.DTOs.Seats;
using Event_And_Parking_Manage_system.Services.Implementation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Event_And_Parking_Manage_system.Controllers;

[ApiController, Route("api"), Authorize]
public class ReservationManagementController(ReservationManagementService service) : ControllerBase
{
    [HttpGet("bookings/{id:int}/hold-status")]
    public Task<HoldStatusDto> GetHold(int id) => service.GetHoldAsync(id,
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), User.IsInRole("Administrator"));
    [HttpGet("payments"), Authorize(Roles = "Administrator")]
    public Task<List<AdminPaymentDto>> GetPayments(string? search, int? eventId, string? status) => service.GetPaymentsAsync(search, eventId, status);
    [HttpPost("events/{eventId:int}/seats/generate"), Authorize(Roles = "Administrator")]
    public async Task<ActionResult<List<SeatDto>>> GenerateSeats(int eventId, GenerateSeatMapDto dto) =>
        Created($"/api/events/{eventId}/seats", await service.GenerateSeatsAsync(eventId, dto));
    [HttpPost("events/{eventId:int}/parking-slots/generate"), Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GenerateParking(int eventId, GenerateParkingLayoutDto dto) =>
        Created($"/api/events/{eventId}/parking-slots", new { count = await service.GenerateParkingAsync(eventId, dto) });
}
