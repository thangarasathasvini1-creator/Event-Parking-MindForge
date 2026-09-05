using Event_And_Parking_Manage_system.DTOs.Dashboard;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/admin/dashboard")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _dashboardService;

        public AdminDashboardController(
            IAdminDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        // ==========================================
        // GET: api/admin/dashboard
        // Get admin dashboard summary
        // ==========================================ojo

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var dashboard =
                await _dashboardService.GetDashboardAsync();

            return Ok(dashboard);
        }
    }
}