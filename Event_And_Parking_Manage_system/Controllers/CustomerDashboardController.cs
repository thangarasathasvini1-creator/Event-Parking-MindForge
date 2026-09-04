using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class CustomerDashboardController : ControllerBase
    {
        private readonly ICustomerDashboardService _dashboardService;

        public CustomerDashboardController(
            ICustomerDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("customer")]
        public async Task<IActionResult> GetCustomerDashboard()
        {
            var customerIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(customerIdClaim, out var customerId))
            {
                return Unauthorized(new
                {
                    message = "Invalid customer identity."
                });
            }

            var dashboard =
                await _dashboardService.GetDashboardAsync(customerId);

            if (dashboard == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            return Ok(dashboard);
        }
    }
}